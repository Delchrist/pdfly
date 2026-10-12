// Local dev server: serves public/ and runs api/*.js handlers (Web Request/Response style, like Vercel).
// MOCK=1 swaps Upstash, Stripe and Resend for in-memory fakes so the whole flow can be tested offline.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PORT = Number(process.env.PORT || 8787);

if (process.env.MOCK === '1') {
  const { installMocks } = await import('./mocks.mjs');
  installMocks();
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };

async function handleApi(req, res, url) {
  const rel = url.pathname.replace(/\/$/, '');
  const file = path.join(ROOT, `${rel}.js`);
  if (!file.startsWith(path.join(ROOT, 'api')) || path.basename(file).startsWith('_') || !fs.existsSync(file)) {
    res.writeHead(404).end('not found');
    return;
  }
  const mod = await import(pathToFileURL(file).href);
  const fn = mod[req.method];
  if (!fn) {
    res.writeHead(405).end('method not allowed');
    return;
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
  try {
    const response = await fn(request);
    const outHeaders = {};
    response.headers.forEach((v, k) => (outHeaders[k] = v));
    // Local http: drop Secure so the cookie works on localhost
    if (outHeaders['set-cookie']) outHeaders['set-cookie'] = outHeaders['set-cookie'].replace('; Secure', '');
    res.writeHead(response.status, outHeaders);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ error: e.message }));
  }
}

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  let file = path.join(ROOT, 'public', p);
  if (!file.startsWith(path.join(ROOT, 'public'))) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    if (!p.endsWith('/') && fs.existsSync(path.join(ROOT, 'public', p, 'index.html'))) return res.writeHead(308, { location: `${p}/` }).end();
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    return res.end(fs.readFileSync(path.join(ROOT, 'public', '404.html')));
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (process.env.MOCK === '1' && url.pathname === '/__mock/emails') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(globalThis.__pdflyMocks.sentEmails));
  }
  if (process.env.MOCK === '1' && url.pathname === '/__mock/pro') {
    const email = url.searchParams.get('email');
    const k = `v2:user:${email}`;
    const e = globalThis.__pdflyMocks.store.get(k) || { v: { email }, exp: 0 };
    Object.assign(e.v, { status: 'active', plan: 'pro', interval: 'year', customerId: 'cus_mockpro', periodEnd: String(Math.floor(Date.now() / 1000) + 86400 * 365) });
    globalThis.__pdflyMocks.store.set(k, e);
    return res.writeHead(200).end('ok');
  }
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  serveStatic(req, res, url);
}).listen(PORT, () => console.log(`PDFly dev server on http://localhost:${PORT}${process.env.MOCK === '1' ? ' (mocks on)' : ''}`));
