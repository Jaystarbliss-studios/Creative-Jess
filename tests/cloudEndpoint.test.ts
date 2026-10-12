import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';

async function findFreePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not allocate a test port.');
  const port = address.port;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

test('cloud AI endpoint rejects cross-origin requests and fails closed when no server key is configured', async () => {
  const port = await findFreePort();
  const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      GEMINI_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exit = once(child, 'exit');
  let stderr = '';
  child.stderr.on('data', (chunk: Buffer) => { stderr = (stderr + chunk.toString()).slice(-8000); });

  try {
    const base = 'http://127.0.0.1:' + port;
    let health: Response | undefined;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        health = await fetch(base + '/api/health');
        if (health.ok) break;
      } catch {
        // Wait for the child process to start listening.
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(health?.ok, 'server did not become healthy: ' + stderr);
    assert.deepEqual(await health.json(), { ok: true, cloudAIConfigured: false });

    const noOrigin = await fetch(base + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    });
    assert.equal(noOrigin.status, 403, 'requests without a browser origin must be rejected before provider use');

    const foreignOrigin = await fetch(base + '/api/ai/chat', {
      method: 'POST',
      headers: { Origin: 'https://attacker.invalid', 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    });
    assert.equal(foreignOrigin.status, 403, 'cross-origin requests must be rejected');

    const sameOrigin = await fetch(base + '/api/ai/chat', {
      method: 'POST',
      headers: { Origin: base, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    });
    assert.equal(sameOrigin.status, 503, 'a same-origin request without a server-side API key must fail closed');
    const body = await sameOrigin.json();
    assert.match(body.error, /Cloud AI is not configured/);
    assert.equal(JSON.stringify(body).includes('GEMINI_API_KEY='), false, 'server responses must not disclose secret values');
  } finally {
    child.kill();
    await exit;
  }
});
