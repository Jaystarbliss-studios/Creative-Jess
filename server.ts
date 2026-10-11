import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));

type ClientMcpTool = { appId: string; name: string; description?: string; inputSchema?: Record<string, unknown> };

function mcpFunctionName(tool: ClientMcpTool): string {
  const identity = tool.appId + '_' + tool.name;
  let hash = 2166136261;
  for (let i = 0; i < identity.length; i++) {
    hash ^= identity.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const suffix = (hash >>> 0).toString(16).padStart(8, '0');
  const prefix = ('mcp_' + identity).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 50);
  return prefix + '_' + suffix;
}

function toGeminiSchema(input: unknown, depth = 0): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input) || depth > 5) return { type: Type.OBJECT, properties: {} };
  const schema = input as Record<string, unknown>;
  const type = schema.type === 'string' ? Type.STRING : schema.type === 'integer' || schema.type === 'number' ? Type.NUMBER : schema.type === 'boolean' ? Type.BOOLEAN : schema.type === 'array' ? Type.ARRAY : Type.OBJECT;
  const result: Record<string, unknown> = { type };
  if (typeof schema.description === 'string') result.description = schema.description.slice(0, 500);
  if (Array.isArray(schema.enum) && schema.enum.length <= 50) result.enum = schema.enum.filter((v) => typeof v === 'string' || typeof v === 'number');
  if (schema.type === 'object' && schema.properties && typeof schema.properties === 'object' && !Array.isArray(schema.properties)) {
    const entries = Object.entries(schema.properties as Record<string, unknown>).slice(0, 30);
    result.properties = Object.fromEntries(entries.map(([key, value]) => [key, toGeminiSchema(value, depth + 1)]));
    if (Array.isArray(schema.required)) result.required = schema.required.filter((key): key is string => typeof key === 'string' && entries.some(([name]) => name === key));
  }
  if (schema.type === 'array' && schema.items) result.items = toGeminiSchema(schema.items, depth + 1);
  return result;
}

const recentRequests = new Map<string, number[]>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function allowRequest(ip: string): boolean {
  const now = Date.now();
  const recent = (recentRequests.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  recentRequests.set(ip, recent);
  return true;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, cloudAIConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post('/api/ai/chat', async (req, res) => {
  const origin = req.get('origin');
  const host = req.get('host');
  let originHost = '';
  try {
    originHost = origin ? new URL(origin).host : '';
  } catch {
    originHost = '';
  }
  if (!originHost || !host || originHost !== host) {
    res.status(403).json({ error: 'A same-origin browser request is required.' });
    return;
  }

  const ip = req.ip || 'unknown';
  if (!allowRequest(ip)) {
    res.status(429).json({ error: 'AI request rate limit reached. Try again shortly.' });
    return;
  }

  const prompt = req.body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 12000) {
    res.status(400).json({ error: 'Prompt must be a non-empty string of at most 12,000 characters.' });
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'Cloud AI is not configured. Set GEMINI_API_KEY as a server-side secret.' });
    return;
  }

  const context = req.body?.context || {};
  const projectName = typeof context.projectName === 'string' ? context.projectName.slice(0, 200) : 'Unknown project';
  const appName = typeof context.appName === 'string' ? context.appName.slice(0, 200) : 'Workspace';
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const suppliedTools: ClientMcpTool[] = Array.isArray(req.body?.mcpTools) ? req.body.mcpTools.slice(0, 100).filter((item: unknown): item is ClientMcpTool => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const tool = item as Record<string, unknown>;
      return typeof tool.appId === 'string' && LAUNCHABLE_APP_IDS.includes(tool.appId) && typeof tool.name === 'string' && /^[a-zA-Z0-9_.:-]{1,128}$/.test(tool.name) && (tool.inputSchema === undefined || (typeof tool.inputSchema === 'object' && tool.inputSchema !== null && !Array.isArray(tool.inputSchema)));
    }) : [];
    const toolByFunctionName = new Map<string, ClientMcpTool>();
    const functionDeclarations: { name: string; description: string; parameters: Record<string, unknown> }[] = [{
      name: 'open_application',
      description: 'Propose launching a configured native application through the paired local companion. This does not open a file or perform editing.',
      parameters: { type: Type.OBJECT, properties: { appId: { type: Type.STRING, enum: LAUNCHABLE_APP_IDS } }, required: ['appId'] },
    }];
    for (const tool of suppliedTools) {
      const name = mcpFunctionName(tool);
      if (toolByFunctionName.has(name)) continue;
      toolByFunctionName.set(name, tool);
      functionDeclarations.push({ name, description: (typeof tool.description === 'string' && tool.description.trim() ? tool.description : tool.name).slice(0, 500), parameters: toGeminiSchema(tool.inputSchema || { type: 'object', properties: {} }) });
    }
    const contents = 'You are the Craft Workspace assistant. Answer helpfully and accurately. You cannot directly access project files. You may propose a documented MCP tool or open_application only when useful to the user. Every proposed action requires explicit user approval in the client; never claim it already happened. Current project: ' + projectName + '. Active application: ' + appName + '. User request: ' + prompt;
    const result = await client.models.generateContent({ model, contents, config: { tools: [{ functionDeclarations }] } });
    const proposedCall = result.functionCalls?.[0];
    if (proposedCall?.name === 'open_application') {
      const proposedAppId = proposedCall.args?.appId;
      if (typeof proposedAppId === 'string' && LAUNCHABLE_APP_IDS.includes(proposedAppId)) {
        res.json({ text: result.text || ('I can request to launch ' + proposedAppId + '. Review and approve the action below before anything runs.'), toolProposal: { name: 'open_application', args: { appId: proposedAppId } }, model });
        return;
      }
    }
    if (proposedCall && typeof proposedCall.name === 'string') {
      const tool = toolByFunctionName.get(proposedCall.name);
      const args = proposedCall.args;
      if (tool && args && typeof args === 'object' && !Array.isArray(args)) {
        res.json({ text: result.text || ('I can request the ' + tool.name + ' tool from ' + tool.appId + '. Review the arguments before approving.'), toolProposal: { name: 'mcp_tool', args: { appId: tool.appId, toolName: tool.name, arguments: args } }, model });
        return;
      }
    }
    const text = result.text;
    if (typeof text !== 'string' || !text.trim()) {
      res.status(502).json({ error: 'The model returned an empty response.' });
      return;
    }
    res.json({ text, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown provider error';
    res.status(502).json({ error: 'Cloud AI request failed.', detail: message });
  }
});

const LAUNCHABLE_APP_IDS = ['artcraft', 'photocraft', 'artcraftx', 'lightcraft', 'filmcraft', 'effectcraft', 'vectorcraft', 'cadcraft', 'wordcraft', 'soundcraft', 'pdfcraft', 'designcraft', 'deckcraft', 'gridcraft'];

const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.use(express.static(path.resolve('dist')));
  app.get('*', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
} else {
  const vite = await createViteServer({
    configFile: path.resolve('vite.config.ts'),
    server: { middlewareMode: true, hmr: false },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log('Craft Workspace server listening on port ' + port);
});
