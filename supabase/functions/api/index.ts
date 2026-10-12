import { Buffer } from 'node:buffer';
import process from 'node:process';
import express from 'express';

if (!(globalThis as { Buffer?: typeof Buffer }).Buffer) {
  (globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
}
if (!(globalThis as { process?: typeof process }).process) {
  (globalThis as { process?: typeof process }).process = process;
}

const [{ createDbPool }, { registerClientPortalRoutes }] = await Promise.all([
  import('../_shared/db-pool.js'),
  import('../_shared/client-portal-routes.js')
]);

const app = express();
const pool = createDbPool();
const allowedOrigins = new Set([
  'https://aitiga32-art.github.io',
  'http://127.0.0.1:8791',
  'http://localhost:8791'
]);

app.disable('x-powered-by');
app.use((req, res, next) => {
  const origin = String(req.get('origin') || '');
  const isLocalPreview = /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin);
  if (allowedOrigins.has(origin) || isLocalPreview) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
  res.set('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();
  return next();
});

app.use((req, res, next) => {
  if (req.url === '/api') req.url = '/';
  else if (req.url.startsWith('/api/')) req.url = req.url.slice(4);
  return next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

registerClientPortalRoutes({
  app,
  pool,
  apiKey: '',
  sessionSecret: Deno.env.get('CLIENT_PORTAL_SESSION_SECRET') || 'pt-x-public-demo-session'
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    return res.json({ ok: true, service: 'sistem-akuntansi-proyek-pt-x' });
  } catch {
    return res.status(503).json({ ok: false, error: 'Database belum tersedia.' });
  }
});

app.use((error, _req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada server.' });
});

app.listen(8000);
