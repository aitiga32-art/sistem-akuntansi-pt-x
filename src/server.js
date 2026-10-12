import express from 'express';
import { fileURLToPath } from 'url';
import { createDbPool } from './db/pool.js';
import { registerClientPortalRoutes } from './modules/client-portal/routes.js';

const app = express();
const publicDir = fileURLToPath(new URL('../public', import.meta.url));
const port = Number(process.env.PORT || 8080);
const pool = createDbPool();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      ok: false,
      error: 'Ukuran upload terlalu besar. Kompres file atau pecah menjadi beberapa berkas.'
    });
  }
  return next(err);
});

app.use('/assets', express.static(publicDir, { maxAge: '1h' }));
app.use('/app/assets', express.static(publicDir, { maxAge: '1h' }));
app.get('/favicon.ico', (req, res) => res.redirect(302, '/assets/branding/pt-x-favicon.svg'));

registerClientPortalRoutes({
  app,
  pool,
  apiKey: String(process.env.API_KEY || '').trim(),
  sessionSecret: process.env.CLIENT_PORTAL_SESSION_SECRET || process.env.DB_PASSWORD || 'pt-x-demo-session'
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('select 1');
    return res.json({ ok: true, service: 'sistem-akuntansi-proyek-pt-x' });
  } catch {
    return res.status(503).json({ ok: false, error: 'Database belum tersedia.' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada server.' });
});

app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

const server = app.listen(port, () => {
  console.log(`PT X accounting demo listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
