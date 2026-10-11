import test from 'node:test';
import assert from 'node:assert/strict';
import {
  executeAdapterCapability,
  getAdapter,
  listRegisteredAdapters,
  registerAdapter,
  unregisterAdapter,
  type CraftAdapter,
} from '../src/services/adapterRegistry';

test('unknown adapter fails closed without executing an operation', async () => {
  await assert.rejects(
    executeAdapterCapability('not-installed', 'open-file', {}),
    /No verified adapter is registered/,
  );
});

test('registered capability validates inputs, checks health, and returns the adapter result', async () => {
  const adapter: CraftAdapter = {
    appId: 'test-adapter',
    version: 'test',
    capabilities: [{
      id: 'create-copy',
      description: 'Create a new copy of a test asset.',
      consequential: true,
      validate: (args) => typeof args.name === 'string' && args.name.length > 0,
    }],
    healthCheck: async () => ({ healthy: true, detail: 'test adapter healthy' }),
    execute: async (_capabilityId, args) => ({ success: true, summary: 'Created ' + String(args.name) }),
  };

  registerAdapter(adapter);
  try {
    assert.equal(getAdapter('test-adapter')?.appId, 'test-adapter');
    assert.equal(listRegisteredAdapters().some((item) => item.appId === 'test-adapter'), true);
    await assert.rejects(
      executeAdapterCapability('test-adapter', 'create-copy', { name: '' }),
      /failed validation/,
    );
    const result = await executeAdapterCapability('test-adapter', 'create-copy', { name: 'sample.png' });
    assert.deepEqual(result, { success: true, summary: 'Created sample.png' });
  } finally {
    unregisterAdapter('test-adapter');
  }
});

test('unhealthy adapters do not execute capabilities', async () => {
  let called = false;
  const adapter: CraftAdapter = {
    appId: 'unhealthy-adapter',
    version: 'test',
    capabilities: [{ id: 'dangerous-operation', description: 'Test', consequential: true }],
    healthCheck: async () => ({ healthy: false, detail: 'not connected' }),
    execute: async () => { called = true; return { success: true, summary: 'should not run' }; },
  };
  registerAdapter(adapter);
  try {
    await assert.rejects(
      executeAdapterCapability('unhealthy-adapter', 'dangerous-operation', {}),
      /health check failed/,
    );
    assert.equal(called, false);
  } finally {
    unregisterAdapter('unhealthy-adapter');
  }
});
