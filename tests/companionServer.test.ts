import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';

async function findFreePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not allocate a test port.');
  const port = address.port;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

test('local companion exposes health and rejects unpaired command requests', async () => {
  const port = await findFreePort();
  const origin = 'http://localhost:3000';
  const child = spawn(process.execPath, ['--import', 'tsx', 'companion/server.ts'], {
    env: {
      ...process.env,
      PORT: '',
      CRAFT_COMPANION_PORT: String(port),
      CRAFT_WORKSPACE_ORIGINS: origin,
      CRAFT_APP_PATHS_JSON: '{}',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exit = once(child, 'exit');
  let stderr = '';
  child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

  try {
    let healthResponse: Response | undefined;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        healthResponse = await fetch('http://127.0.0.1:' + port + '/health', {
          headers: { Origin: origin, 'X-Craft-Origin': 'craft-workspace-web' },
        });
        if (healthResponse.ok) break;
      } catch {
        // Wait briefly for the local test process to bind its port.
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    assert.ok(healthResponse?.ok, 'companion server did not become healthy: ' + stderr);
    const health = await healthResponse.json();
    assert.equal(health.version, '0.1.0');
    assert.deepEqual(health.availableApps, []);
    assert.deepEqual(health.allowlistedCommands, ['open-app']);

    const rejectedPair = await fetch('http://127.0.0.1:' + port + '/pair', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'incorrect-token' }),
    });
    assert.equal(rejectedPair.status, 401);

    const rejectedCommand = await fetch('http://127.0.0.1:' + port + '/commands', {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'open-app', args: ['photocraft'] }),
    });
    assert.equal(rejectedCommand.status, 401);
  } finally {
    child.kill();
    await exit;
  }
});
