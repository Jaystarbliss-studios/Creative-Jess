import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

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
  if (!origin || !host || new URL(origin).host !== host) {
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
    const contents = 'You are the Craft Workspace assistant. Answer helpfully and accurately. You cannot execute application tools or access project files unless a future verified adapter explicitly provides them. Never claim to have run an operation. Current project: ' + projectName + '. Active application: ' + appName + '. User request: ' + prompt;
    const result = await client.models.generateContent({ model, contents });
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
