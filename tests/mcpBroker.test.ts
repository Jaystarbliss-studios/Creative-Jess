import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { McpBroker } from '../companion/mcpBroker.ts';

test('MCP broker keeps a discovered CLI session alive and validates calls before dispatch', { skip: process.platform === 'win32' }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'craft-mcp-test-'));
  const executable = path.join(directory, 'fake-mcp');
  const script = `#!/usr/bin/env node
const readline = require('node:readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  let request;
  try { request = JSON.parse(line); } catch { process.exit(2); }
  if (typeof request.id !== 'number') return;
  let result = {};
  if (request.method === 'initialize') result = { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'fake', version: '1' } };
  else if (request.method === 'tools/list') result = { tools: [{ name: 'echo', description: (process.env.GEMINI_API_KEY ? 'secret-leaked' : 'clean') + '|' + process.argv.slice(2).join('|'), inputSchema: { type: 'object', properties: { text: { type: 'string', maxLength: 20 } }, required: ['text'], additionalProperties: false } }] };
  else if (request.method === 'tools/call' && request.params.name === 'echo') result = { content: [{ type: 'text', text: request.params.arguments.text }] };
  else { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'unknown method' } }) + '\\n'); return; }
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }) + '\\n');
});
`;
  await writeFile(executable, script, 'utf8');
  await chmod(executable, 0o755);
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-secret-must-not-be-inherited';
  const broker = new McpBroker({ testapp: executable, scopedapp: executable }, { scopedapp: { readRoot: directory, writeRoot: directory } });
  try {
    const tools = await broker.listTools('testapp');
    const toolsAgain = await broker.listTools('testapp');
    assert.equal(toolsAgain.length, 1, 'tool discovery should reuse the same live CLI session');
    assert.equal(tools.length, 1);
    assert.equal(tools[0].name, 'echo');
    assert.equal(tools[0].description, 'clean|mcp', 'default invocation uses only the documented MCP subcommand and must not inherit provider credentials');
    const scopedTools = await broker.listTools('scopedapp');
    assert.equal(scopedTools[0].description, 'clean|mcp|--automation-read-root|' + directory + '|--automation-write-root|' + directory, 'scoped roots are passed only to the app explicitly configured for them');
    const response = await broker.callTool('testapp', 'echo', { text: 'hello' });
    assert.deepEqual(response.content, [{ type: 'text', text: 'hello' }]);
    await assert.rejects(() => broker.callTool('testapp', 'missing', {}), /not present in the configured CLI tool catalog/);
    await assert.rejects(() => broker.callTool('testapp', 'echo', { text: 42 }), /must be string/);
    await assert.rejects(() => broker.callTool('testapp', 'echo', { text: 'hello', unexpected: true }), /not allowed/);
  } finally {
    broker.close();
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey;
    await rm(directory, { recursive: true, force: true });
  }
});
