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
  const finUpstream = (process.env.FIN_UPSTREAM || 'http://localhost:3000').replace(/\/+$/, '');
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
    res = await fetch(`${finUpstream}/api/org/token`, {
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

/** Cho /healthz — không tự fetch. */
export function tokenStatus() {
  if (!cached) return { cached: false };
  return {
    cached: true,
    expiresInSeconds: Math.max(0, Math.round((cached.expiresAtMs - Date.now()) / 1000)),
  };
}
