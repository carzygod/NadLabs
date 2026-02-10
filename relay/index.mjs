import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';

const TARGET = process.env.RELAY_TARGET || 'https://nad.fun';

const loadEnvFile = () => {
  const envPath = '.env';
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
};

loadEnvFile();

const PORT = Number(process.env.RELAY_PORT || 8788);
const allowedOrigins = (process.env.RELAY_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const getCorsOrigin = (origin) => {
  if (!origin) return '*';
  if (allowedOrigins.length === 0) return '*';
  const host = origin.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (allowedOrigins.includes(origin) || allowedOrigins.includes(host)) return origin;
  return '';
};

const send = (req, res, status, body, headers = {}) => {
  const origin = req.headers.origin || '';
  const corsOrigin = getCorsOrigin(origin);
  const baseHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type, Nad-Web-Access',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
  if (corsOrigin) {
    baseHeaders['Access-Control-Allow-Origin'] = corsOrigin;
    baseHeaders['Vary'] = 'Origin';
  }
  res.writeHead(status, {
    ...baseHeaders,
    ...headers,
  });
  res.end(body);
};

const collectBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const server = createServer(async (req, res) => {
  if (!req.url) return send(req, res, 404, 'Not found');
  if (req.method === 'OPTIONS') return send(req, res, 200, '');

  if (!req.url.startsWith('/relay')) {
    return send(req, res, 404, 'Not found');
  }

  const upstreamPath = req.url.replace(/^\/relay/, '');
  const url = `${TARGET}${upstreamPath}`;

  try {
    const body = (req.method === 'GET' || req.method === 'HEAD') ? undefined : await collectBody(req);

    const headers = {
      ...req.headers,
    };
    delete headers.host;
    delete headers.origin;
    delete headers.referer;

    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const resBody = Buffer.from(await upstream.arrayBuffer());
    const resHeaders = {};
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-encoding') return;
      if (key.toLowerCase() === 'content-length') return;
      if (key.toLowerCase() === 'transfer-encoding') return;
      if (key.toLowerCase() === 'access-control-allow-origin') return;
      if (key.toLowerCase() === 'access-control-allow-headers') return;
      if (key.toLowerCase() === 'access-control-allow-methods') return;
      resHeaders[key] = value;
    });

    send(req, res, upstream.status, resBody, resHeaders);
  } catch (err) {
    send(req, res, 500, JSON.stringify({ error: err?.message || String(err) }), { 'Content-Type': 'application/json' });
  }
});

server.listen(PORT, () => {
  console.log(`nad.fun relay listening on :${PORT}`);
});
