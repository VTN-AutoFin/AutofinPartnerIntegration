/**
 * AUTOFIN Widget — Sample partner proxy (BFF).
 *
 * Đây là ĐIỂM TIẾP XÚC DUY NHẤT của browser:
 *   GET /embedded/autofin-embed.js(.map)  → SDK widget (fetch từ WebApp, cache)
 *   ALL /api/*                            → finserver, tự gắn Bearer machine token
 *   GET /healthz                          → trạng thái proxy
 *   (prod) static dist/ + SPA fallback    → example app build
 *
 * Browser không bao giờ biết finserver / WebApp tồn tại:
 *  - Không redirect, không CORS expose, không passthrough header lộ nguồn
 *    (server, via, x-powered-by, upstream URL trong lỗi).
 *  - Authorization của client bị GHI ĐÈ bằng machine token server-side;
 *    ORG_CLIENT_ID/SECRET không bao giờ xuống browser.
 */

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAccessToken, refreshAccessToken, tokenStatus } from './token-manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

const PORT = Number(process.env.PORT) || 5501;
const FIN_UPSTREAM = (process.env.FIN_UPSTREAM || 'http://localhost:3000').replace(/\/+$/, '');
const WEBAPP_UPSTREAM = (process.env.WEBAPP_UPSTREAM || 'http://localhost:4200').replace(/\/+$/, '');

// Header client gửi lên nhưng KHÔNG được chuyển sang upstream
const HOP_BY_HOP = new Set([
  'host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade',
  'proxy-authenticate', 'proxy-authorization', 'te', 'trailer',
  // token client (nếu có) luôn bị thay bằng machine token
  'authorization', 'cookie',
  // fetch tự tính lại theo body đã forward
  'content-length',
]);
// Header upstream trả về nhưng không cho browser thấy
const STRIP_RESPONSE_HEADERS = new Set([
  'server', 'via', 'x-powered-by', 'connection', 'keep-alive',
  'transfer-encoding', 'content-encoding', 'content-length',
]);

const SDK_FILES = {
  '/embedded/autofin-embed.js': '/embed/autofin-embed.js',
  '/embedded/autofin-embed.js.map': '/embed/autofin-embed.js.map',
};
const SDK_CACHE_TTL_MS = 5 * 60 * 1000;
const sdkCache = new Map(); // key → { body: Buffer, contentType, fetchedAtMs }

const app = express();
// Route /api đọc raw body (JSON) — không dùng body parser toàn cục.
app.use(express.raw({ type: '*/*', limit: '2mb' }));

// ---------------------------------------------------------------- SDK widget
app.get(['/embedded/autofin-embed.js', '/embedded/autofin-embed.js.map'], async (req, res) => {
  const key = req.path;
  const upstreamPath = SDK_FILES[key];

  const hit = sdkCache.get(key);
  if (hit && Date.now() - hit.fetchedAtMs < SDK_CACHE_TTL_MS) {
    res.set('Content-Type', hit.contentType);
    res.set('Cache-Control', 'public, max-age=300');
    return res.send(hit.body);
  }

  try {
    const upstream = await fetch(`${WEBAPP_UPSTREAM}${upstreamPath}`);
    if (!upstream.ok) {
      return res.status(502).type('text/plain').send(
        `Khong tai duoc SDK widget (HTTP ${upstream.status}). Kiem tra WEBAPP_UPSTREAM (${WEBAPP_UPSTREAM}) da chua?`
      );
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    sdkCache.set(key, {
      body: buf,
      contentType: upstream.headers.get('content-type') || 'application/javascript; charset=utf-8',
      fetchedAtMs: Date.now(),
    });
    res.set('Content-Type', sdkCache.get(key).contentType);
    res.set('Cache-Control', 'public, max-age=300');
    return res.send(buf);
  } catch (e) {
    return res.status(502).type('text/plain').send(
      `Khong tai duoc SDK widget: ${e.message}. Kiem tra WEBAPP_UPSTREAM (${WEBAPP_UPSTREAM}) da chua?`
    );
  }
});

// ----------------------------------------------------------------- API proxy
app.all('/api/*', async (req, res) => {
  const upstreamUrl = `${FIN_UPSTREAM}${req.originalUrl}`;

  const buildHeaders = (token) => {
    const headers = {};
    for (const [name, value] of Object.entries(req.headers)) {
      if (HOP_BY_HOP.has(name) || value === undefined) continue;
      headers[name] = Array.isArray(value) ? value.join(', ') : String(value);
    }
    headers['authorization'] = `Bearer ${token}`;
    headers['accept'] = headers['accept'] || 'application/json';
    return headers;
  };

  const forward = async (token) => {
    const body =
      req.method === 'GET' || req.method === 'HEAD' || !req.body || req.body.length === 0
        ? undefined
        : req.body;
    return fetch(upstreamUrl, { method: req.method, headers: buildHeaders(token), body });
  };

  try {
    let upstream;
    try {
      upstream = await forward(await getAccessToken());
    } catch (tokenErr) {
      return res.status(502).type('application/json').send(JSON.stringify({
        errorMessage: `Proxy chua lay duoc machine token: ${tokenErr.message}`,
      }));
    }

    // 401 → token hết hạn/bị thu hồi: refresh đúng 1 lần rồi thử lại
    if (upstream.status === 401) {
      try {
        upstream = await forward(await refreshAccessToken());
      } catch {
        /* giữ response 401 gốc */
      }
    }

    const resHeaders = {};
    upstream.headers.forEach((value, name) => {
      if (!STRIP_RESPONSE_HEADERS.has(name.toLowerCase())) resHeaders[name] = value;
    });
    res.status(upstream.status).set(resHeaders);
    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.send(buf);
  } catch (e) {
    // Không lộ URL upstream trong message
    return res.status(502).type('application/json').send(
      JSON.stringify({ errorMessage: 'Proxy khong goi duoc API nguon' })
    );
  }
});

// ------------------------------------------------------------------- healthz
app.get('/healthz', (req, res) => {
  res.json({
    ok: true,
    upstreams: { apiConfigured: true, webappConfigured: true },
    token: tokenStatus(),
    mode: fs.existsSync(DIST_DIR) ? 'prod (dist/)' : 'dev (chỉ proxy — chạy vite riêng)',
  });
});

// -------------------------------------------------- prod static example app
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback — trừ /api và /embedded đã bắt ở trên
  app.get('*', (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`[proxy] listening http://localhost:${PORT}`);
  console.log(`[proxy] SDK     ${WEBAPP_UPSTREAM}/embed/* → /embedded/autofin-embed.js`);
  console.log(`[proxy] API     ${FIN_UPSTREAM}/api/* → /api/* (Bearer machine token)`);
});
