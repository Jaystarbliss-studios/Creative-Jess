import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface, type Interface } from 'node:readline';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { safeChildEnvironment } from './safeEnv.js';

type Obj = Record<string, unknown>;
type McpTool = { name: string; description?: string; inputSchema?: Obj; [key: string]: unknown };
type Pending = { resolve: (value: Obj) => void; reject: (error: Error) => void; timer: NodeJS.Timeout };
const isObj = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v);

function validate(value: unknown, schema: unknown, label = 'arguments'): string | null {
  if (!isObj(schema)) return null;
  const t = schema.type;
  const ok = typeof t !== 'string' || (t === 'object' ? isObj(value)
    : t === 'array' ? Array.isArray(value) : t === 'string' ? typeof value === 'string'
    : t === 'number' ? typeof value === 'number' && Number.isFinite(value)
    : t === 'integer' ? typeof value === 'number' && Number.isInteger(value)
    : t === 'boolean' ? typeof value === 'boolean' : t === 'null' ? value === null : true);
  if (!ok) return label + ' must be ' + String(t) + '.';
  if (Array.isArray(schema.enum) && !schema.enum.some((x) => Object.is(x, value))) return label + ' is not an allowed value.';
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) return label + ' is too short.';
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) return label + ' is too long.';
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) return label + ' is below its minimum.';
    if (typeof schema.maximum === 'number' && value > schema.maximum) return label + ' is above its maximum.';
  }
  if (Array.isArray(value)) {
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) return label + ' has too many items.';
    if (schema.items) for (let i = 0; i < value.length; i++) { const e = validate(value[i], schema.items, label + '[' + i + ']'); if (e) return e; }
  }
  if (isObj(value)) {
    const props = isObj(schema.properties) ? schema.properties : {};
    const required = Array.isArray(schema.required) ? schema.required.filter((x): x is string => typeof x === 'string') : [];
    for (const key of required) if (!(key in value)) return label + '.' + key + ' is required.';
    for (const [key, child] of Object.entries(value)) {
      if (!(key in props) && schema.additionalProperties === false) return label + '.' + key + ' is not allowed.';
      if (key in props) { const e = validate(child, props[key], label + '.' + key); if (e) return e; }
    }
  }
  return null;
}

class McpSession {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly lines: Interface;
  private readonly pending = new Map<number, Pending>();
  private nextId = 1;
  private tools: McpTool[] = [];
  private closed = false;
  private readonly ready: Promise<void>;

  constructor(executable: string, args: string[]) {
    this.child = spawn(executable, args, { cwd: path.dirname(executable), shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: safeChildEnvironment() });
    this.lines = createInterface({ input: this.child.stdout, crlfDelay: Infinity });
    this.lines.on('line', (line) => this.onLine(line));
    this.child.stderr.on('data', (chunk: Buffer) => { const message = chunk.toString().trim(); if (message) console.error('[craft-mcp]', message.slice(0, 1000)); });
    this.child.once('error', (e) => this.fail(new Error('Could not start configured MCP CLI: ' + e.message)));
    this.child.once('exit', (code, signal) => { this.closed = true; this.fail(new Error('MCP CLI exited (code ' + String(code) + ', signal ' + String(signal) + ').')); });
    this.ready = this.initialize();
  }

  private onLine(line: string) {
    if (!line || Buffer.byteLength(line, 'utf8') > 1024 * 1024) return;
    let msg: unknown; try { msg = JSON.parse(line); } catch { return; }
    if (!isObj(msg) || typeof msg.id !== 'number') return;
    const p = this.pending.get(msg.id); if (!p) return;
    this.pending.delete(msg.id); clearTimeout(p.timer);
    if (isObj(msg.error)) p.reject(new Error(typeof msg.error.message === 'string' ? msg.error.message : 'MCP request failed.'));
    else if (isObj(msg.result)) p.resolve(msg.result);
    else p.reject(new Error('MCP server returned an invalid response envelope.'));
  }

  private fail(error: Error) {
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); }
    this.pending.clear();
  }

  private request(method: string, params: Obj = {}, timeoutMs = 30000): Promise<Obj> {
    if (this.closed || this.child.stdin.destroyed) return Promise.reject(new Error('MCP session is not running.'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('MCP request timed out after ' + timeoutMs + ' ms.')); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n', (error) => {
        if (!error) return;
        const p = this.pending.get(id); if (!p) return;
        this.pending.delete(id); clearTimeout(p.timer); reject(error);
      });
    });
  }

  private async initialize() {
    await new Promise<void>((resolve, reject) => {
      if (this.closed) { reject(new Error('MCP process closed during startup.')); return; }
      const timer = setTimeout(() => reject(new Error('MCP CLI did not start in time.')), 15000);
      this.child.once('spawn', () => { clearTimeout(timer); resolve(); });
      this.child.once('error', (e) => { clearTimeout(timer); reject(e); });
    });
    await this.request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'craft-workspace-local-broker', version: '0.1.0' } }, 15000);
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const response = await this.request('tools/list', {}, 20000);
    this.tools = Array.isArray(response.tools) ? response.tools.filter((x): x is McpTool => isObj(x) && typeof x.name === 'string' && /^[a-zA-Z0-9_.:-]{1,128}$/.test(x.name)) : [];
  }

  get registeredToolCount() { return this.tools.length; }
  async listTools() { await this.ready; return this.tools.map((x) => ({ ...x })); }
  async callTool(name: string, args: unknown) {
    await this.ready;
    const tool = this.tools.find((x) => x.name === name);
    if (!tool) throw new Error('MCP tool is not present in the configured CLI tool catalog.');
    if (!isObj(args)) throw new Error('MCP tool arguments must be a JSON object.');
    const issue = validate(args, tool.inputSchema);
    if (issue) throw new Error('MCP argument validation failed: ' + issue);
    if (Buffer.byteLength(JSON.stringify(args), 'utf8') > 64 * 1024) throw new Error('MCP arguments exceed the 64 KB safety limit.');
    return this.request('tools/call', { name, arguments: args }, 60000);
  }
  dispose() { this.closed = true; this.fail(new Error('MCP session was closed.')); this.lines.close(); this.child.kill(); }
}

export type McpScopedRoots = Record<string, { readRoot?: string; writeRoot?: string }>;
export type McpExtraArgs = Record<string, string[]>;

export class McpBroker {
  private readonly sessions = new Map<string, McpSession>();
  constructor(private readonly paths: Record<string, string>, private readonly scopedRoots: McpScopedRoots = {}, private readonly extraArgs: McpExtraArgs = {}) {}
  configuredApps() { return Object.keys(this.paths); }
  registeredToolsCount() { return [...this.sessions.values()].reduce((total, session) => total + session.registeredToolCount, 0); }
  private async session(appId: string) {
    if (!Object.prototype.hasOwnProperty.call(this.paths, appId)) throw new Error('No MCP CLI is configured for this application.');
    let s = this.sessions.get(appId); if (s) return s;
    s = await this.createSession(appId); this.sessions.set(appId, s); return s;
  }
  private async createSession(appId: string) {
    if (!Object.prototype.hasOwnProperty.call(this.paths, appId)) throw new Error('No MCP CLI is configured for this application.');
    const executable = this.paths[appId];
    await access(executable);
    // Scope flags are opt-in per app because upstream CLI contracts differ.
    const args = ['mcp', ...(this.extraArgs[appId] || [])];
    const roots = this.scopedRoots[appId];
    for (const [kind, root] of [['read', roots?.readRoot], ['write', roots?.writeRoot]] as const) {
      if (!root) continue;
      if (!path.isAbsolute(root)) throw new Error('Configured MCP ' + kind + ' root must be an absolute path.');
      const info = await import('node:fs/promises').then((fs) => fs.stat(root));
      if (!info.isDirectory()) throw new Error('Configured MCP ' + kind + ' root must be an existing directory.');
      args.push(kind === 'read' ? '--automation-read-root' : '--automation-write-root', path.normalize(root));
    }
    return new McpSession(executable, args);
  }
  async listTools(appId: string) {
    const session = await this.session(appId);
    try {
      return await session.listTools();
    } catch (error) {
      if (this.sessions.get(appId) === session) {
        this.sessions.delete(appId);
        session.dispose();
      }
      throw error;
    }
  }
  async callTool(appId: string, name: string, args: unknown) {
    const session = await this.session(appId);
    try {
      return await session.callTool(name, args);
    } catch (error) {
      // A crashed or timed-out session must not poison future calls. Remove only
      // the same session so concurrent requests cannot evict a replacement.
      if (this.sessions.get(appId) === session) {
        this.sessions.delete(appId);
        session.dispose();
      }
      throw error;
    }
  }
  close() { for (const s of this.sessions.values()) s.dispose(); this.sessions.clear(); }
}
