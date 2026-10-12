import test from 'node:test';
import assert from 'node:assert/strict';
import { selectToolsForModel } from '../src/services/aiService';

function makeTools(appId: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    appId,
    name: index === 0 ? 'list_commands' : 'tool_' + index,
    description: index === 1 ? 'Create and export a vector image' : 'Tool number ' + index,
    inputSchema: { type: 'object', properties: {} },
  }));
}

test('model tool selection caps schema count and preserves tools from every configured app', () => {
  const tools = [
    ...makeTools('lightcraft', 326),
    ...makeTools('vectorcraft', 32),
    ...makeTools('wordcraft', 16),
    ...makeTools('pdfcraft', 153),
  ];
  const selected = selectToolsForModel(tools, 'vectorcraft', 'create and export a vector image', 100);
  assert.equal(selected.length, 100);
  assert.ok(selected.some((tool) => tool.appId === 'vectorcraft' && tool.name === 'tool_1'), 'active app and prompt-relevant tool should be prioritized');
  for (const appId of ['lightcraft', 'vectorcraft', 'wordcraft', 'pdfcraft']) {
    assert.ok(selected.some((tool) => tool.appId === appId), appId + ' must not be starved by a large catalog from another app');
  }
  assert.ok(selected.filter((tool) => tool.appId === 'lightcraft').length < 100, 'the largest catalog must not monopolize all tool slots');
});

test('model tool selection returns the original full catalog when it fits the limit', () => {
  const tools = makeTools('photocraft', 4);
  assert.deepEqual(selectToolsForModel(tools, 'photocraft', 'edit photo', 100), tools);
});

test('model tool selection honors a zero limit', () => {
  assert.deepEqual(selectToolsForModel(makeTools('photocraft', 4), 'photocraft', '', 0), []);
});
