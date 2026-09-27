/**
 * Org machine-token manager — chạy SERVER-SIDE duy nhất.
 *
 * Lấy token từ finserver: POST {FIN_UPSTREAM}/api/org/token
 *   Authorization: Basic base64(clientId:clientSecret)
 *   body (tuỳ chọn): { externalUserId }
 *   → { data: { accessToken, tokenType: 'Bearer', expiresIn (giây) } }
 *
 * Có HAI loại token:
 *
 *  - Token tổ chức (không kèm externalUserId) — dùng cho widget mà mọi khách
 *    thấy dữ liệu giống nhau. Cache một bản dùng chung.
 *  - Token theo khách (kèm externalUserId) — dùng cho widget giữ trạng thái
 *    riêng từng khách, hiện là chatbot. AUTOFIN ký externalUserId vào token nên
 *    trình duyệt không thể đổi sang khách khác. Cache riêng theo từng khách.
 *
 * Cả hai đều cache đến (expiresIn - 60s), gộp các request đồng thời vào một lần
 * fetch, và refresh bắt buộc khi upstream trả 401.
 */

const SKEW_SECONDS = 60;

/** Trần số khách giữ trong bộ nhớ — web đông khách sẽ phình vô hạn nếu không có. */
const MAX_END_USER_ENTRIES = 5000;

let cached = null; // { token, expiresAtMs }
let inflight = null; // Promise — dedup các request đồng thời

// externalUserId → { token, expiresAtMs } và → Promise đang bay
const endUserCache = new Map();
const endUserInflight = new Map();

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

async function requestToken(externalUserId) {
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(externalUserId ? { externalUserId } : {}),
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

  return {
    token: accessToken,
    expiresAtMs: Date.now() + Math.max(expiresIn - SKEW_SECONDS, 30) * 1000,
  };
}

async function fetchToken() {
  cached = await requestToken(null);
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

/**
 * Token mang danh tính một khách của site đối tác.
 *
 * `externalUserId` PHẢI lấy từ phiên đăng nhập của chính đối tác — tuyệt đối
 * không lấy từ header/query/body mà trình duyệt gửi lên, vì khi đó khách nào
 * cũng đọc được hội thoại của khách khác.
 */
export async function getEndUserToken(externalUserId) {
  if (!externalUserId) throw new Error('Thiếu externalUserId');

  const hit = endUserCache.get(externalUserId);
  if (hit && Date.now() < hit.expiresAtMs) return hit.token;

  let pending = endUserInflight.get(externalUserId);
  if (!pending) {
    pending = requestToken(externalUserId)
      .then((entry) => {
        // Map giữ thứ tự chèn nên khoá cũ nhất nằm đầu — đủ để chặn phình.
        if (endUserCache.size >= MAX_END_USER_ENTRIES) {
          endUserCache.delete(endUserCache.keys().next().value);
        }
        endUserCache.set(externalUserId, entry);
        return entry.token;
      })
      .finally(() => endUserInflight.delete(externalUserId));
    endUserInflight.set(externalUserId, pending);
  }
  return pending;
}

/** Gọi khi upstream trả 401 với token của khách. */
export async function refreshEndUserToken(externalUserId) {
  endUserCache.delete(externalUserId);
  return getEndUserToken(externalUserId);
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
  const username = process.env.PARTNER_CLIENT_ID || '';
  const password = process.env.PARTNER_CLIENT_SECRET || '';
  // AUTH_API_BASE: base URL dịch vụ auth (đã kèm prefix, vd
  // https://api.autofin.vn/gateway/api). Trống = dùng FIN_UPSTREAM.
  const finUpstream = (
    process.env.AUTH_API_BASE ||
    process.env.FIN_UPSTREAM ||
    'http://localhost:3000/api'
  ).replace(/\/+$/, '');
  if (!partnerCode || !password || !username) return null;
  return { partnerCode, username, password, finUpstream };
}

/** true nếu .env có credential partner (login sẽ chạy tự động). */
export function isPartnerAuthConfigured() {
  return partnerConfig() !== null;
}

async function fetchPartnerToken() {
  const cfg = partnerConfig();
  if (!cfg) throw new Error('Thiếu PARTNER_CODE / PARTNER_CLIENT_ID / PARTNER_CLIENT_SECRET — xem .env.example');

  let res;
  try {
    res = await fetch(`${cfg.finUpstream}/auth/partner-sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        partnerCode: cfg.partnerCode,
        username: cfg.username,
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

/** Cho /healthz — số khách đang giữ token. */
export function endUserTokenStatus() {
  return { cached: endUserCache.size, inflight: endUserInflight.size };
}

/** Cho /healthz — trạng thái partner token. */
export function partnerTokenStatus() {
  if (!partnerCached) return { cached: false };
  return {
    cached: true,
    expiresInSeconds: Math.max(0, Math.round((partnerCached.expiresAtMs - Date.now()) / 1000)),
  };
}
