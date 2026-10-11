import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const binary = option('--binary');
const supportsRoots = process.argv.includes('--scoped-roots');
if (!binary || !path.isAbsolute(binary)) {
  console.error('Usage: node scripts/smoke-mcp.mjs --binary <absolute-path> [--scoped-roots]');
  process.exit(2);
}
const temp = await mkdtemp(path.join(os.tmpdir(), 'craft-mcp-smoke-'));
const args = ['mcp'];
if (supportsRoots) args.push('--automation-read-root', temp, '--automation-write-root', temp);
const child = spawn(binary, args, { shell: false, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
let stdout = '';
let stderr = '';
let buffer = '';
let nextId = 1;
const pending = new Map();
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  buffer += chunk;
  if (Buffer.byteLength(buffer, 'utf8') > 2 * 1024 * 1024) {
    failAll(new Error('MCP stdout exceeded 2 MB without a complete response.'));
    child.kill();
    return;
  }
  let newline;
  while ((newline = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    stdout += line + '\n';
    let message;
    try { message = JSON.parse(line); } catch { continue; }
    if (typeof message.id !== 'number') continue;
    const waiter = pending.get(message.id);
    if (!waiter) continue;
    pending.delete(message.id);
    clearTimeout(waiter.timer);
    if (message.error) waiter.reject(new Error(message.error.message || 'MCP request failed.'));
    else waiter.resolve(message.result || {});
  }
});
child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-8000); });
child.on('error', (error) => failAll(error));
child.on('exit', (code, signal) => failAll(new Error('MCP CLI exited before smoke test completed (code ' + code + ', signal ' + signal + ').\n' + stderr)));
function failAll(error) {
  for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(error); }
  pending.clear();
}
function request(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('Timed out waiting for ' + method + '.\n' + stderr)); }, 20000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n', (error) => {
      if (!error) return;
      const waiter = pending.get(id);
      if (waiter) { pending.delete(id); clearTimeout(waiter.timer); reject(error); }
    });
  });
}
try {
  const init = await request('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'craft-workspace-ci-smoke', version: '1.0.0' },
  });
  if (!init.serverInfo || !init.capabilities) throw new Error('MCP initialize response omitted serverInfo/capabilities.');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const catalog = await request('tools/list', {});
  if (!Array.isArray(catalog.tools) || catalog.tools.length === 0) throw new Error('MCP tools/list returned no tools.');
  let readOnlyToolCall = 'skipped: no zero-argument read-only tool was advertised';
  const safeTool = catalog.tools.find((tool) => tool && typeof tool.name === 'string' && tool.annotations?.readOnlyHint === true && (!Array.isArray(tool.inputSchema?.required) || tool.inputSchema.required.length === 0));
  if (safeTool) {
    const call = await request('tools/call', { name: safeTool.name, arguments: {} });
    if (call.isError === true) throw new Error('Read-only MCP tool call failed: ' + safeTool.name);
    readOnlyToolCall = safeTool.name;
  }
  console.log(JSON.stringify({ ok: true, serverInfo: init.serverInfo, protocolVersion: init.protocolVersion, toolCount: catalog.tools.length, firstTools: catalog.tools.slice(0, 8).map((tool) => tool.name), readOnlyToolCall, scopedRoots: supportsRoots }));
  child.stdin.end();
  child.kill();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error), stdout: stdout.slice(-3000), stderr }));
  child.kill();
  process.exitCode = 1;
} finally {
  await new Promise((resolve) => setTimeout(resolve, 100));
  await rm(temp, { recursive: true, force: true });
}
