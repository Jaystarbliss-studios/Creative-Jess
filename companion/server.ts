import { spawn } from 'node:child_process';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import express, { type Request, type Response, type NextFunction } from 'express';
import dotenv from 'dotenv';
import { McpBroker } from './mcpBroker.js';

dotenv.config();

type AppPathMap = Record<string, string>;

function readMcpPaths(): AppPathMap {
  const raw = process.env.CRAFT_MCP_PATHS_JSON;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const entries: AppPathMap = {};
    for (const [appId, candidate] of Object.entries(parsed)) {
      if (!/^[a-z0-9-]+$/.test(appId) || typeof candidate !== 'string') continue;
      const executable = candidate.trim();
      if (path.isAbsolute(executable)) entries[appId] = path.normalize(executable);
    }
    return entries;
  } catch {
    console.error('CRAFT_MCP_PATHS_JSON is invalid JSON. No MCP CLI paths were registered.');
    return {};
  }
}

function readAppPaths(): AppPathMap {
  const raw = process.env.CRAFT_APP_PATHS_JSON;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const entries: AppPathMap = {};
    for (const [appId, candidate] of Object.entries(parsed)) {
      if (!/^[a-z0-9-]+$/.test(appId) || typeof candidate !== 'string') continue;
      const executable = candidate.trim();
      if (path.isAbsolute(executable)) entries[appId] = path.normalize(executable);
    }
    return entries;
  } catch {
    console.error('CRAFT_APP_PATHS_JSON is invalid JSON. No application paths were registered.');
    return {};
  }
}

const appPaths = readAppPaths();
const mcpBroker = new McpBroker(readMcpPaths());
const allowedOrigins = new Set(
  (process.env.CRAFT_WORKSPACE_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const pairingToken = randomBytes(24).toString('base64url');
const port = Number(process.env.CRAFT_COMPANION_PORT || 9876);
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', false);
app.use(express.json({ limit: '96kb' }));

function rejectOrigin(res: Response): void {
  res.status(403).json({ message: 'Origin is not on the local companion allowlist.' });
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('origin');
  if (!origin || !allowedOrigins.has(origin)) {
    if (req.method === 'OPTIONS') rejectOrigin(res);
    else next();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Craft-Origin');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

function originAllowed(req: Request): boolean {
  const origin = req.get('origin');
  return Boolean(origin && allowedOrigins.has(origin));
}

function tokenMatches(candidate: unknown): boolean {
  if (typeof candidate !== 'string') return false;
  const provided = Buffer.from(candidate);
  const expected = Buffer.from(pairingToken);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function bearerMatches(req: Request): boolean {
  const header = req.get('authorization') || '';
  return tokenMatches(header.startsWith('Bearer ') ? header.slice(7) : '');
}

app.get('/health', (req, res) => {
  if (!originAllowed(req)) {
    rejectOrigin(res);
    return;
  }
  res.json({
    version: '0.1.0',
    os: os.platform(),
    allowlistedCommands: ['open-app', 'mcp-list-tools', 'mcp-call-tool'],
    registeredToolsCount: 0,
    availableApps: Object.keys(appPaths),
    availableMcpApps: mcpBroker.configuredApps(),
  });
});

app.post('/pair', (req, res) => {
  if (!originAllowed(req)) {
    rejectOrigin(res);
    return;
  }
  if (!tokenMatches(req.body?.token)) {
    res.status(401).json({ paired: false, message: 'Pairing token was rejected.' });
    return;
  }
  res.json({ paired: true });
});

app.post('/commands', async (req, res) => {
  if (!originAllowed(req)) {
    rejectOrigin(res);
    return;
  }
  if (!bearerMatches(req)) {
    res.status(401).json({ success: false, exitCode: 1, message: 'Companion authorization is required.' });
    return;
  }

  const command = req.body?.command;
  const args = req.body?.args;
  if (command !== 'open-app' || !Array.isArray(args) || args.length !== 1 || typeof args[0] !== 'string') {
    res.status(400).json({ success: false, exitCode: 1, message: 'Only the structured open-app command is supported.' });
    return;
  }

  const appId = args[0];
  if (!/^[a-z0-9-]+$/.test(appId) || !Object.prototype.hasOwnProperty.call(appPaths, appId)) {
    res.status(404).json({ success: false, exitCode: 1, message: 'No local executable path is configured for this application.' });
    return;
  }

  const executable = appPaths[appId];
  try {
    await access(executable, constants.F_OK);
  } catch {
    res.status(404).json({ success: false, exitCode: 1, message: 'Configured executable does not exist. Check CRAFT_APP_PATHS_JSON.' });
    return;
  }

  // No shell is used and the browser cannot supply an executable path or arbitrary arguments.
  const child = spawn(executable, [], {
    cwd: path.dirname(executable),
    detached: true,
    stdio: 'ignore',
    shell: false,
    windowsHide: false,
  });

  child.once('error', (error) => {
    if (!res.headersSent) res.status(500).json({ success: false, exitCode: 1, message: 'The operating system could not start the application process: ' + error.message });
  });
  child.once('spawn', () => {
    child.unref();
    if (!res.headersSent) {
      res.json({
        success: true,
        exitCode: 0,
        output: 'The operating system accepted a launch process for ' + appId + '. Application readiness and editing functionality have not been verified.',
      });
    }
  });
});

app.get('/mcp/:appId/tools', async (req, res) => {
  if (!originAllowed(req)) {
    rejectOrigin(res);
    return;
  }
  if (!bearerMatches(req)) {
    res.status(401).json({ error: 'Companion authorization is required.' });
    return;
  }
  const appId = req.params.appId;
  if (!/^[a-z0-9-]+$/.test(appId)) {
    res.status(400).json({ error: 'Invalid application ID.' });
    return;
  }
  try {
    const tools = await mcpBroker.listTools(appId);
    res.json({ appId, tools });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'MCP tool discovery failed.' });
  }
});

app.post('/mcp/:appId/call', async (req, res) => {
  if (!originAllowed(req)) {
    rejectOrigin(res);
    return;
  }
  if (!bearerMatches(req)) {
    res.status(401).json({ error: 'Companion authorization is required.' });
    return;
  }
  const appId = req.params.appId;
  const name = req.body?.name;
  const args = req.body?.arguments ?? {};
  if (!/^[a-z0-9-]+$/.test(appId) || typeof name !== 'string' || !/^[a-zA-Z0-9_.:-]{1,128}$/.test(name)) {
    res.status(400).json({ error: 'A valid app ID and MCP tool name are required.' });
    return;
  }
  try {
    const result = await mcpBroker.callTool(appId, name, args);
    res.json({ appId, name, result });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'MCP tool call failed.' });
  }
});

process.once('SIGINT', () => { mcpBroker.close(); process.exit(0); });
process.once('SIGTERM', () => { mcpBroker.close(); process.exit(0); });

app.listen(port, '127.0.0.1', () => {
  console.log('Craft Local Companion listening on http://127.0.0.1:' + port);
  console.log('Pairing token (keep private; enter it only in your own workspace): ' + pairingToken);
  console.log('Configured app IDs: ' + (Object.keys(appPaths).join(', ') || 'none'));
  console.log('Configured MCP CLI IDs: ' + (mcpBroker.configuredApps().join(', ') || 'none'));
  if (appPaths && Object.keys(appPaths).length === 0) {
    console.log('Set CRAFT_APP_PATHS_JSON to absolute executable paths before native launch is available.');
  }
  console.log('Allowed workspace origins: ' + [...allowedOrigins].join(', '));
});
