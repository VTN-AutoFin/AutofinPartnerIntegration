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
// FAC JWT cho khách (T5 partner visitor) — server-side duy nhất.
//
// Đổi token tổ chức (mang externalUserId) lấy JWT của FAC qua
// POST {FAC_UPSTREAM}/api/v1/auth/central/exchange  (Authorization: Bearer
// end-user token). FAC tự introspect token ở finserver rồi tạo/tra cứu user
// khách trong org đối tác (end-user-identity.md). JWT của FAC KHÔNG có exp
// (phiên do FAC quản, TTL 30 phút) nên cache theo TTL đó trừ skew; hết hạn →
// exchange lại (giống refresh).
// ---------------------------------------------------------------------------

const facCache = new Map(); // externalUserId → { token, expiresAtMs }
const facInflight = new Map();
const FAC_TTL_S = 25 * 60; // < 30 phút session TTL của FAC → skew an toàn

function facConfig() {
  // Cùng một biến với route /api/v1 của server.mjs (FAC_API_UPSTREAM);
  // FAC_UPSTREAM chỉ là fallback cho env cũ.
  const facUpstream = (
    process.env.FAC_API_UPSTREAM ||
    process.env.FAC_UPSTREAM ||
    'http://localhost:8002'
  ).replace(/\/+$/, '');
  return { facUpstream };
}

async function requestFacToken(externalUserId) {
  const { facUpstream } = facConfig();
  const endUserToken = await getEndUserToken(externalUserId);
  const res = await fetch(`${facUpstream}/api/v1/auth/central/exchange`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${endUserToken}`,
      'content-type': 'application/json',
      'accept-encoding': 'identity',
    },
    body: '{}',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`FAC exchange HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  const json = await res.json();
  if (!json?.access_token) throw new Error('FAC exchange thiếu access_token');
  return {
    token: json.access_token,
    expiresAtMs: Date.now() + FAC_TTL_S * 1000,
  };
}

/** JWT FAC cho khách — exchange lần đầu, cache tới hết TTL rồi exchange lại. */
export async function getFacToken(externalUserId) {
  if (!externalUserId) throw new Error('Thiếu externalUserId');

  const hit = facCache.get(externalUserId);
  if (hit && Date.now() < hit.expiresAtMs) return hit.token;

  let pending = facInflight.get(externalUserId);
  if (!pending) {
    pending = requestFacToken(externalUserId)
      .then((entry) => {
        if (facCache.size >= MAX_END_USER_ENTRIES) {
          facCache.delete(facCache.keys().next().value);
        }
        facCache.set(externalUserId, entry);
        return entry.token;
      })
      .finally(() => facInflight.delete(externalUserId));
    facInflight.set(externalUserId, pending);
  }
  return pending;
}

/** Gọi khi FAC trả 401 — exchange lại từ token end-user mới. */
export async function refreshFacToken(externalUserId) {
  facCache.delete(externalUserId);
  return getFacToken(externalUserId);
}

// ---------------------------------------------------------------------------
// Org machine token (ORG_CLIENT_ID/SECRET) là DANH TÍNH DUY NHẤT cho các route
// /api/gw thường. Partner user login (PARTNER_*) đã BỎ — mọi danh tính:
//   - API thị trường  : org machine token
//   - Chat theo khách : token end-user per-visitor (từ org token)
//   - FAC chat        : JWT FAC per-visitor (exchange từ end-user token)
// ---------------------------------------------------------------------------
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

/** Cho /healthz — số khách đang giữ JWT FAC. */
export function facTokenStatus() {
  return { cached: facCache.size, inflight: facInflight.size };
}
