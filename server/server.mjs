/**
 * AUTOFIN Widget — Sample partner proxy (Backend-for-Frontend).
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
import {
  getAccessToken,
  refreshAccessToken,
  getEndUserToken,
  refreshEndUserToken,
  getPartnerToken,
  refreshPartnerToken,
  isPartnerAuthConfigured,
  tokenStatus,
  endUserTokenStatus,
  partnerTokenStatus,
} from './token-manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

const PORT = Number(process.env.PORT) || 5501;
const FIN_UPSTREAM = (process.env.FIN_UPSTREAM || 'http://localhost:3000').replace(/\/+$/, '');
const WEBAPP_UPSTREAM = (process.env.WEBAPP_UPSTREAM || 'http://localhost:4200').replace(/\/+$/, '');
// Financial Agent Chat — dịch vụ RIÊNG, không phải chat service của /api/gw/v1/chat/*.
// Bundle remote + API /api/v1/* đều nằm dưới base này.
const FAC_UPSTREAM = (
  process.env.FAC_UPSTREAM || 'https://api-sit.autofin.vn:4443/financial-agent'
).replace(/\/+$/, '');

// Header client gửi lên nhưng KHÔNG được chuyển sang upstream
const HOP_BY_HOP = new Set([
  'host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade',
  'proxy-authenticate', 'proxy-authorization', 'te', 'trailer',
  // cookie client luôn bị bỏ (finserver route ghi đè Authorization bằng machine token)
  'cookie',
  // Authorization của client KHÔNG BAO GIỜ được đi tiếp: proxy tự gắn token
  // server-side. Trước đây nhánh forward ẩn danh để header này lọt lên nguồn.
  'authorization',
  // fetch tự tính lại theo body đã forward
  'content-length',
  // NGÒN ĐỐT: undici (Node 22) crash `assert(!this.paused)` khi giải nén gzip
  // từ nginx SIT — exception async lọt qua uncaughtException handler → await
  // fetch treo vĩnh viễn. Luôn yêu cầu upstream gửi KHÔNG nén.
  'accept-encoding',
]);
// Header upstream trả về nhưng không cho browser thấy
const STRIP_RESPONSE_HEADERS = new Set([
  'server', 'via', 'x-powered-by', 'connection', 'keep-alive',
  'transfer-encoding', 'content-encoding', 'content-length',
]);

const SDK_FILES = {
  '/embedded/autofin-embed.js': { upstream: () => WEBAPP_UPSTREAM, path: '/embed/autofin-embed.js' },
  '/embedded/autofin-embed.js.map': { upstream: () => WEBAPP_UPSTREAM, path: '/embed/autofin-embed.js.map' },
  // FAC phục vụ qua proxy để browser không thấy domain AUTOFIN, giống SDK widget.
  '/embedded/fac-chat.js': { upstream: () => FAC_UPSTREAM, path: '/remote/fac-chat.js' },
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
// Route sinh từ SDK_FILES: thêm file mới vào map là đủ, không sót route.
app.get(Object.keys(SDK_FILES), async (req, res) => {
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
    // identity: tránh bug undici + gzip (assert !this.paused) — xem HOP_BY_HOP
    const upstream = await fetch(`${origin}${target.path}`, {
      headers: { 'accept-encoding': 'identity' },
    });
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

// ------------------------------------------------------- phiên khách (demo)
// Đối tác thật đã có phiên đăng nhập riêng; ở đây dùng một cookie ký đơn giản
// để ví dụ chạy được. Điều BẮT BUỘC giữ khi copy sang hệ thống thật: id khách
// lấy từ phiên phía SERVER, không bao giờ từ header/query/body của trình duyệt.
const VISITOR_COOKIE = 'demo_visitor';

const readVisitorId = (req) => {
  const raw = req.headers.cookie || '';
  const match = raw
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(VISITOR_COOKIE.length + 1));
  // Cùng bộ ký tự finserver nhận cho externalUserId.
  return /^[A-Za-z0-9._:@|-]{1,128}$/.test(value) ? value : null;
};

// Widget giữ trạng thái riêng từng khách. Các route khác dùng token tổ chức.
// /api/v1/* là API của FAC (mount apiBase = origin proxy → FAC gọi về đây).
const isEndUserScopedPath = (path) =>
  path.startsWith('/api/gw/v1/chat/') || path.startsWith('/api/v1/');

/**
 * FAC có upstream riêng VÀ cách ghép path riêng.
 *
 * finserver gắn ở `/api`, nên `finPathFromOriginal` bỏ tiền tố đó đi. FAC thì
 * ngược lại: base của nó đã là `/financial-agent` và API thật nằm ở
 * `/financial-agent/api/v1/*`, nên phải giữ nguyên `/api`.
 */
const resolveUpstream = (originalUrl, path) =>
  path.startsWith('/api/v1/')
    ? `${FAC_UPSTREAM}${originalUrl}`
    : `${FIN_UPSTREAM}${finPathFromOriginal(originalUrl)}`;

// ----------------------------------------------------------------- API proxy
// Browser: /api/gw/v1/x  →  upstream: {FIN_UPSTREAM}/gw/v1/x
// (FIN_UPSTREAM chứa đủ base+prefix, vd https://host/gateway/api hoặc :3000/api)
const finPathFromOriginal = (originalUrl) => originalUrl.replace(/^\/api/, '') || '/';

app.all('/api/*', async (req, res) => {
  const upstreamUrl = resolveUpstream(req.originalUrl, req.path);

  const buildHeaders = (token) => {
    const headers = {};
    for (const [name, value] of Object.entries(req.headers)) {
      if (HOP_BY_HOP.has(name) || value === undefined) continue;
      headers[name] = Array.isArray(value) ? value.join(', ') : String(value);
    }
    if (token) headers['authorization'] = `Bearer ${token}`;
    headers['accept'] = headers['accept'] || 'application/json';
    headers['accept-encoding'] = 'identity';
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
    // Route chat mang danh tính khách nên phải dùng token riêng của khách đó.
    // Các route còn lại: ưu tiên PARTNER user token (auto-login từ .env),
    // fallback org machine token, không có gì thì forward ẩn danh (route public).
    const endUserScoped = isEndUserScopedPath(req.path);
    let getToken;
    let refreshToken;
    if (endUserScoped) {
      const visitorId = readVisitorId(req);
      if (!visitorId) {
        return res.status(401).type('application/json').send(
          JSON.stringify({
            errorCode: 'VISITOR_SESSION_REQUIRED',
            errorMessage: 'Chua dang nhap khach — widget chat can phien nguoi dung',
          })
        );
      }
      getToken = () => getEndUserToken(visitorId);
      refreshToken = () => refreshEndUserToken(visitorId);
    } else {
      getToken = isPartnerAuthConfigured() ? getPartnerToken : getAccessToken;
      refreshToken = isPartnerAuthConfigured() ? refreshPartnerToken : refreshAccessToken;
    }
    try {
      upstream = await forward(await getToken());
    } catch (tokenErr) {
      // Chat thì KHÔNG được forward ẩn danh: không có token nghĩa là không có
      // danh tính khách, mà finserver sẽ từ chối — báo lỗi thẳng cho dễ sửa.
      if (endUserScoped) {
        // Chi tiết chỉ vào log server: message upstream có chứa URL API nguồn.
        console.error(`[proxy] khong lay duoc token cho khach: ${tokenErr.message}`);
        return res.status(502).type('application/json').send(
          JSON.stringify({
            errorCode: 'END_USER_TOKEN_FAILED',
            errorMessage: 'Khong lay duoc token cho khach — xem log proxy',
          })
        );
      }
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
      headers: { 'accept-encoding': 'identity' }, // undici+gzip bug — xem HOP_BY_HOP
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

// -------------------------------------------------- phiên khách demo (routes)
// Thay cho hệ thống đăng nhập thật của đối tác. Chỉ có tác dụng đặt/xoá cookie
// phía server; trình duyệt không tự chọn được mình là khách nào ở tầng API.
app.post('/demo/login', (req, res) => {
  let visitorId = '';
  try {
    visitorId = String(JSON.parse(req.body?.toString('utf8') || '{}').visitorId || '').trim();
  } catch {
    /* body rỗng/không phải JSON */
  }
  if (!/^[A-Za-z0-9._:@|-]{1,128}$/.test(visitorId)) {
    return res.status(400).json({
      errorCode: 'VISITOR_ID_INVALID',
      errorMessage: 'visitorId chi nhan 1-128 ky tu chu, so hoac . _ : @ | -',
    });
  }
  res.set(
    'Set-Cookie',
    `${VISITOR_COOKIE}=${encodeURIComponent(visitorId)}; Path=/; HttpOnly; SameSite=Lax`
  );
  return res.json({ visitorId });
});

app.post('/demo/logout', (req, res) => {
  res.set('Set-Cookie', `${VISITOR_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res.json({ ok: true });
});

app.get('/demo/me', (req, res) => {
  return res.json({ visitorId: readVisitorId(req) });
});

// ------------------------------------------------------------------- healthz
app.get('/healthz', (req, res) => {
  res.json({
    ok: true,
    token: tokenStatus(),
    endUserTokens: endUserTokenStatus(),
    partnerAuth: isPartnerAuthConfigured(),
    partnerToken: partnerTokenStatus(),
    upstreams: {
      finserver: FIN_UPSTREAM,
      webapp: WEBAPP_UPSTREAM,
      fac: FAC_UPSTREAM,
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
