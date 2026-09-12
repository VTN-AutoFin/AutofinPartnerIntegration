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
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import {
  getAccessToken,
  refreshAccessToken,
  getPartnerToken,
  refreshPartnerToken,
  isPartnerAuthConfigured,
  tokenStatus,
  partnerTokenStatus,
} from './token-manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

const PORT = Number(process.env.PORT) || 5501;
const FIN_UPSTREAM = (process.env.FIN_UPSTREAM || 'http://localhost:3000').replace(/\/+$/, '');
const WEBAPP_UPSTREAM = (process.env.WEBAPP_UPSTREAM || 'http://localhost:4200').replace(/\/+$/, '');
const FAC_WEB_UPSTREAM = (process.env.FAC_WEB_UPSTREAM || 'http://localhost:5173').replace(/\/+$/, '');
const FAC_API_UPSTREAM = (process.env.FAC_API_UPSTREAM || 'http://localhost:8002').replace(/\/+$/, '');

// Header client gửi lên nhưng KHÔNG được chuyển sang upstream
const HOP_BY_HOP = new Set([
  'host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade',
  'proxy-authenticate', 'proxy-authorization', 'te', 'trailer',
  // cookie client luôn bị bỏ (finserver route ghi đè Authorization bằng machine
  // token; FAC route giữ Authorization client nguyên vẹn cho phiên FAC)
  'cookie',
  // fetch tự tính lại theo body đã forward
  'content-length',
]);
// Header upstream trả về nhưng không cho browser thấy
const STRIP_RESPONSE_HEADERS = new Set([
  'server', 'via', 'x-powered-by', 'connection', 'keep-alive',
  'transfer-encoding', 'content-encoding', 'content-length',
]);

const SDK_FILES = {
  '/embedded/autofin-embed.js': { upstream: () => WEBAPP_UPSTREAM, path: '/embed/autofin-embed.js' },
  '/embedded/autofin-embed.js.map': { upstream: () => WEBAPP_UPSTREAM, path: '/embed/autofin-embed.js.map' },
  // FAC ChatPanel remote bundle (window.FacAgentChat)
  '/embedded/fac-chat.js': { upstream: () => FAC_WEB_UPSTREAM, path: '/remote/fac-chat.js' },
};
const SDK_CACHE_TTL_MS = 5 * 60 * 1000;
const sdkCache = new Map(); // key → { body: Buffer, contentType, fetchedAtMs }

const app = express();

// Node 22 undici có thể ném assertion khi TLS stream bị abort giữa chừng —
// example proxy thì KHÔNG được chết vì lỗi mạng phía client: log rồi sống tiếp.
process.on('uncaughtException', (err) => {
  console.error(`[proxy] uncaughtException (bo qua): ${err.message}`);
});
// Route /api đọc raw body (JSON) — không dùng body parser toàn cục.
app.use(express.raw({ type: '*/*', limit: '2mb' }));

// ---------------------------------------------------------------- SDK widget
app.get(['/embedded/autofin-embed.js', '/embedded/autofin-embed.js.map', '/embedded/fac-chat.js'], async (req, res) => {
  const key = req.path;
  const target = SDK_FILES[key];
  const origin = target.upstream();

  const hit = sdkCache.get(key);
  if (hit && Date.now() - hit.fetchedAtMs < SDK_CACHE_TTL_MS) {
    res.set('Content-Type', hit.contentType);
    res.set('Cache-Control', 'public, max-age=300');
    return res.send(hit.body);
  }

  try {
    const upstream = await fetch(`${origin}${target.path}`);
    if (!upstream.ok) {
      return res.status(502).type('text/plain').send(
        `Khong tai duoc SDK widget (HTTP ${upstream.status}). Kiem tra nguon ${origin}${target.path} da chua?`
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
      `Khong tai duoc SDK widget: ${e.message}. Kiem tra nguon ${origin} da chua?`
    );
  }
});

// ------------------------------------------------------------- FAC API proxy
// fac-chat.js bundle SIT build có VITE_API_BASE=/financial-agent → browser gọi
// /financial-agent/api/v1/* (shape SIT, như WebApp route handler). Forward giữ
// nguyên suffix sang FAC_API_UPSTREAM (đã gồm /financial-agent). Route này
// STREAM (pipe) — SSE chat /message:stream không được buffer.
app.all('/financial-agent/api/*', async (req, res) => {
  const suffix = req.originalUrl.replace(/^\/financial-agent/, '');
  const upstreamUrl = `${FAC_API_UPSTREAM}${suffix}`;
  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (HOP_BY_HOP.has(name) || value === undefined) continue;
    headers[name] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  const body =
    req.method === 'GET' || req.method === 'HEAD' || !req.body || req.body.length === 0
      ? undefined
      : req.body;
  try {
    const upstream = await fetch(upstreamUrl, { method: req.method, headers, body });
    const resHeaders = {};
    upstream.headers.forEach((value, name) => {
      if (!STRIP_RESPONSE_HEADERS.has(name.toLowerCase())) resHeaders[name] = value;
    });
    res.status(upstream.status).set(resHeaders);
    if (upstream.body) {
      Readable.fromWeb(upstream.body).pipe(res);
    } else {
      res.end();
    }
  } catch {
    return res.status(502).type('application/json').send(
      JSON.stringify({ errorMessage: 'Proxy khong goi duoc FAC API' })
    );
  }
});

// FAC ChatPanel (/api/v1/*) — FAC backend tự quản phiên (login/SSE), KHÔNG gắn
// machine token org; header client (Authorization…) được forward nguyên vẹn.
app.all(['/api/v1/*', '/api/v1'], async (req, res) => {
  const upstreamUrl = `${FAC_API_UPSTREAM}${req.originalUrl}`;
  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (HOP_BY_HOP.has(name) || value === undefined) continue;
    headers[name] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  const body =
    req.method === 'GET' || req.method === 'HEAD' || !req.body || req.body.length === 0
      ? undefined
      : req.body;
  try {
    const upstream = await fetch(upstreamUrl, { method: req.method, headers, body });
    const resHeaders = {};
    upstream.headers.forEach((value, name) => {
      if (!STRIP_RESPONSE_HEADERS.has(name.toLowerCase())) resHeaders[name] = value;
    });
    res.status(upstream.status).set(resHeaders);
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    return res.status(502).type('application/json').send(
      JSON.stringify({ errorMessage: 'Proxy khong goi duoc FAC API' })
    );
  }
});

// ----------------------------------------------------------------- API proxy
// Browser: /api/gw/v1/x  →  upstream: {FIN_UPSTREAM}/gw/v1/x
// (FIN_UPSTREAM chứa đủ base+prefix, vd https://host/gateway/api hoặc :3000/api)
const finPathFromOriginal = (originalUrl) => originalUrl.replace(/^\/api/, '') || '/';

app.all('/api/*', async (req, res) => {
  const upstreamUrl = `${FIN_UPSTREAM}${finPathFromOriginal(req.originalUrl)}`;

  const buildHeaders = (token) => {
    const headers = {};
    for (const [name, value] of Object.entries(req.headers)) {
      if (HOP_BY_HOP.has(name) || value === undefined) continue;
      headers[name] = Array.isArray(value) ? value.join(', ') : String(value);
    }
    if (token) headers['authorization'] = `Bearer ${token}`;
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
    // Token gắn Bearer: ưu tiên PARTNER user token (auto-login từ
    // PARTNER_CODE/USERNAME/PASSWORD trong .env); fallback org machine token;
    // không có gì cấu hình/hết hạng → forward anonymous (endpoint public).
    const getToken = isPartnerAuthConfigured() ? getPartnerToken : getAccessToken;
    const refreshToken = isPartnerAuthConfigured() ? refreshPartnerToken : refreshAccessToken;
    try {
      upstream = await forward(await getToken());
    } catch (tokenErr) {
      // Org-token module chưa có trên upstream (vd SIT) nhưng /api/gw/v1/*
      // public → forward KHÔNG gắn Bearer thay vì chết 502.
      console.warn(`[proxy] khong co token — forward anonymous: ${tokenErr.message}`);
      upstream = await forward(null);
    }

    // 401 → token hết hạn/bị thu hồi: refresh đúng 1 lần rồi thử lại
    if (upstream.status === 401) {
      try {
        upstream = await forward(await refreshToken());
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

// ------------------------------------------------- charting library passthrough
// Widget chart (TradingView) tự nạp /static/charting_library/* từ cùng origin —
// forward thẳng về WebApp upstream (file tĩnh, không đụng token).
// Client abort → abort cả fetch upstream (tránh undici assert crash node 22).
app.use('/static', async (req, res) => {
  const abort = new AbortController();
  req.on('close', () => abort.abort());
  try {
    const upstream = await fetch(`${WEBAPP_UPSTREAM}/static${req.url}`, {
      signal: abort.signal,
    });
    if (!upstream.ok) {
      return res.status(upstream.status).type('text/plain').send(`Khong tai duoc ${req.url}`);
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    if (res.writableEnded || abort.signal.aborted) return;
    res.set('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    return res.send(buf);
  } catch (e) {
    if (abort.signal.aborted) return;
    return res.status(502).type('text/plain').send(`Proxy khong goi duoc static: ${e.message}`);
  }
});

// ------------------------------------------------------------------- healthz
app.get('/healthz', (req, res) => {
  res.json({
    ok: true,
    token: tokenStatus(),
    partnerAuth: isPartnerAuthConfigured(),
    partnerToken: partnerTokenStatus(),
    upstreams: {
      finserver: FIN_UPSTREAM,
      webapp: WEBAPP_UPSTREAM,
      facWeb: FAC_WEB_UPSTREAM,
      facApi: FAC_API_UPSTREAM,
    },
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
