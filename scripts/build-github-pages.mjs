import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, '_site');
const assetDir = path.join(outputDir, 'assets');
const siteBase = '/sistem-akuntansi-pt-x';
const clientId = '6ed6c7fb-f3ee-4bd0-8215-bdcb4bf724a7';

const pageRoutes = new Map([
  ['', 'client-menu.html'],
  ['pt-x-buku-penjualan', 'hti-buku-penjualan.html'],
  ['pt-x-buku-pembelian-fp', 'hti-buku-pembelian-fp.html'],
  ['pt-x-buku-pembelian-non-ppn', 'hti-buku-pembelian-non-ppn.html'],
  ['buku-bank', 'buku-bank.html'],
  ['buku-kas', 'buku-kas.html'],
  ['pt-x-buku-aktiva', 'hti-buku-aktiva.html'],
  ['pt-x-jurnal-umum', 'jurnal-adjustment.html'],
  ['pt-x-biaya', 'hti-biaya.html'],
  ['pt-x-buku-kontrol', 'hti-buku-kontrol.html'],
  ['setting-coa', 'setting-coa.html'],
  ['period-posting', 'period-posting.html'],
  ['jurnal-adjustment', 'jurnal-adjustment.html'],
  ['jurnal-umum', 'jurnal-adjustment.html'],
  ['buku-besar', 'buku-besar.html'],
  ['neraca-lajur', 'neraca-lajur.html'],
  ['laba-rugi', 'laporan-keuangan.html'],
  ['neraca', 'laporan-keuangan.html'],
  ['perhitungan-pajak', 'laporan-keuangan.html']
]);

function transformText(source, extension, fileName) {
  let value = source
    .replaceAll('/app/assets/', `${siteBase}/assets/`)
    .replaceAll('"/app/client', `"${siteBase}/app/client`)
    .replaceAll("'/app/client", `'${siteBase}/app/client`);

  if (extension === '.html' && fileName !== 'login.html') {
    const runtimeTag = `  <script src="${siteBase}/assets/client/github-pages-runtime.js"></script>\n`;
    value = value.replace('</head>', runtimeTag + '</head>');
  }
  return value;
}

async function transformTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await transformTree(filePath);
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    if (!['.html', '.js', '.css'].includes(extension)) continue;
    if (entry.name === 'github-pages-runtime.js') continue;
    const source = await readFile(filePath, 'utf8');
    await writeFile(filePath, transformText(source, extension, entry.name));
  }
}

async function writeRoute(slug, sourceFile) {
  const routeDir = path.join(outputDir, 'app', 'client', 'clients', clientId, slug);
  await writeHtmlRoute(routeDir, sourceFile);
}

async function writeHtmlRoute(routeDir, sourceFile) {
  await mkdir(routeDir, { recursive: true });
  const source = await readFile(path.join(rootDir, 'public', 'client', sourceFile), 'utf8');
  await writeFile(path.join(routeDir, 'index.html'), transformText(source, '.html', sourceFile));
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(path.join(rootDir, 'public'), assetDir, { recursive: true });
await transformTree(assetDir);

for (const [slug, sourceFile] of pageRoutes) {
  await writeRoute(slug, sourceFile);
}

await writeHtmlRoute(path.join(outputDir, 'app', 'client'), 'home.html');
await writeHtmlRoute(path.join(outputDir, 'app', 'client', 'dashboard'), 'dashboard.html');
await writeHtmlRoute(path.join(outputDir, 'app', 'client', 'access-users'), 'access-users.html');

const menuUrl = `${siteBase}/app/client/clients/${clientId}/`;
await writeFile(path.join(outputDir, 'index.html'), `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sistem Akuntansi PT X</title>
  <meta http-equiv="refresh" content="0; url=${menuUrl}">
</head>
<body>
  <p>Membuka <a href="${menuUrl}">Sistem Akuntansi PT X</a>...</p>
</body>
</html>
`);
await mkdir(path.join(outputDir, 'app', 'client', 'login'), { recursive: true });
await writeFile(path.join(outputDir, 'app', 'client', 'login', 'index.html'), `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Membuka Sistem Akuntansi PT X</title>
  <meta http-equiv="refresh" content="0; url=${menuUrl}">
</head>
<body>
  <p>Membuka <a href="${menuUrl}">Sistem Akuntansi PT X</a>...</p>
</body>
</html>
`);
await writeFile(path.join(outputDir, '.nojekyll'), '');

console.log(`GitHub Pages build ready in ${outputDir}`);
