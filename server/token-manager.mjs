/**
 * Org machine-token manager — chạy SERVER-SIDE duy nhất.
 *
 * Lấy token từ finserver: POST {FIN_UPSTREAM}/api/org/token
 *   Authorization: Basic base64(clientId:clientSecret)
 *   → { data: { accessToken, tokenType: 'Bearer', expiresIn (giây) } }
 *
 * Token được cache đến (expiresIn - 60s); các request đồng thời share 1 lần
 * fetch; nếu upstream trả 401 thì refresh bắt buộc rồi retry.
 */

const SKEW_SECONDS = 60;

let cached = null; // { token, expiresAtMs }
let inflight = null; // Promise — dedup các request đồng thời

function config() {
  const clientId = process.env.ORG_CLIENT_ID || '';
  const clientSecret = process.env.ORG_CLIENT_SECRET || '';
  const finUpstream = (process.env.FIN_UPSTREAM || 'http://localhost:3000/api').replace(/\/+$/, '');
  if (!clientId || !clientSecret) {
    throw new Error(
      'Thiếu ORG_CLIENT_ID / ORG_CLIENT_SECRET — xem .env.example'
    );
  }
  return { clientId, clientSecret, finUpstream };
}

async function fetchToken() {
  const { clientId, clientSecret, finUpstream } = config();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  let res;
  try {
    // finUpstream đã kèm prefix /api (hoặc /gateway/api trên SIT)
    res = await fetch(`${finUpstream}/org/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: 'application/json',
      },
    });
  } catch (e) {
    throw new Error(`Không gọi được finserver (${finUpstream}): ${e.message}`);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Lấy org token thất bại: HTTP ${res.status}${json?.message ? ` — ${json.message}` : ''}`
    );
  }

  const payload = json?.data || json;
  const accessToken = payload?.accessToken;
  const expiresIn = Number(payload?.expiresIn) || 3600;
  if (!accessToken) throw new Error('Response /api/org/token thiếu accessToken');

  cached = {
    token: accessToken,
    expiresAtMs: Date.now() + Math.max(expiresIn - SKEW_SECONDS, 30) * 1000,
  };
  return cached.token;
}

/** Token hợp lệ (cache còn hạn) hoặc fetch mới. */
export async function getAccessToken() {
  if (cached && Date.now() < cached.expiresAtMs) return cached.token;
  if (!inflight) {
    inflight = fetchToken().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

/** Gọi khi upstream trả 401: bỏ cache, lấy token mới. */
export async function refreshAccessToken() {
  cached = null;
  return getAccessToken();
}

// ---------------------------------------------------------------------------
// Partner auto-login (user token) — server-side duy nhất.
//
// POST {AUTH_API_BASE|FIN_UPSTREAM}/auth/partner-sign-in
//   { partnerCode, username?, password }
//   → { userId, accessToken, refreshToken, expiresIn }
//
// Partner chỉ đặt code/username/password trong .env; token KHÔNG bao giờ
// xuống browser — proxy gắn Bearer vào mọi /api/gw/* trước khi forward.
// ---------------------------------------------------------------------------

let partnerCached = null; // { token, expiresAtMs }
let partnerInflight = null;

function partnerConfig() {
  const partnerCode = process.env.PARTNER_CODE || '';
  const username = process.env.PARTNER_USERNAME || '';
  const password = process.env.PARTNER_PASSWORD || '';
  // AUTH_API_BASE: base URL dịch vụ auth (đã kèm prefix, vd
  // https://api-sit.autofin.vn:4443/gateway/api). Trống = dùng FIN_UPSTREAM.
  const finUpstream = (
    process.env.AUTH_API_BASE ||
    process.env.FIN_UPSTREAM ||
    'http://localhost:3000/api'
  ).replace(/\/+$/, '');
  if (!partnerCode || !password) return null;
  return { partnerCode, username, password, finUpstream };
}

/** true nếu .env có credential partner (login sẽ chạy tự động). */
export function isPartnerAuthConfigured() {
  return partnerConfig() !== null;
}

async function fetchPartnerToken() {
  const cfg = partnerConfig();
  if (!cfg) throw new Error('Thiếu PARTNER_CODE / PARTNER_PASSWORD — xem .env.example');

  let res;
  try {
    res = await fetch(`${cfg.finUpstream}/auth/partner-sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        partnerCode: cfg.partnerCode,
        username: cfg.username || undefined,
        password: cfg.password,
      }),
    });
  } catch (e) {
    throw new Error(`Không gọi được finserver (${cfg.finUpstream}): ${e.message}`);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Partner sign-in thất bại: HTTP ${res.status}${json?.error ? ` — ${json.error}` : ''}${json?.message ? ` — ${json.message}` : ''}`
    );
  }

  const accessToken = json?.accessToken;
  const expiresIn = Number(json?.expiresIn) || 3600;
  if (!accessToken) throw new Error('Response partner-sign-in thiếu accessToken');

  partnerCached = {
    token: accessToken,
    expiresAtMs: Date.now() + Math.max(expiresIn - SKEW_SECONDS, 30) * 1000,
  };
  return partnerCached.token;
}

/** Partner user token (cache đến expiresIn - skew) hoặc login mới. */
export async function getPartnerToken() {
  if (!partnerConfig()) throw new Error('Partner auth chưa cấu hình trong .env');
  if (partnerCached && Date.now() < partnerCached.expiresAtMs) return partnerCached.token;
  if (!partnerInflight) {
    partnerInflight = fetchPartnerToken().finally(() => {
      partnerInflight = null;
    });
  }
  return partnerInflight;
}

/** Gọi khi upstream trả 401: bỏ cache, login lại. */
export async function refreshPartnerToken() {
  partnerCached = null;
  return getPartnerToken();
}

/** Cho /healthz — không tự fetch. */
export function tokenStatus() {
  if (!cached) return { cached: false };
  return {
    cached: true,
    expiresInSeconds: Math.max(0, Math.round((cached.expiresAtMs - Date.now()) / 1000)),
  };
}

/** Cho /healthz — trạng thái partner token. */
export function partnerTokenStatus() {
  if (!partnerCached) return { cached: false };
  return {
    cached: true,
    expiresInSeconds: Math.max(0, Math.round((partnerCached.expiresAtMs - Date.now()) / 1000)),
  };
}
