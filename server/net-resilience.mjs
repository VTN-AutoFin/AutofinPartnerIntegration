/**
 * Net resilience cho proxy — chống flake mạng (DNS hỏng thời điểm, upstream chậm).
 *
 * BỐI CẢNH: máy dev dùng WSL, resolver DNS cục bộ hay timeout từng đợt →
 * `fetch` của Node (undici) resolve DNS LẠI TỪNG request mới → lỗi
 * `fetch failed` rải rác, chat chết vì chuỗi mint token gồm nhiều chặng.
 * Không sửa DNS máy (ngoài phạm vi project) — proxy tự chống ở tầng app:
 *
 *  1. CACHE DNS: `lookup()` bọc `dns.lookup` — kết quả dùng lại trong TTL
 *     (60s; lỗi cache 5s để không dồn request vào tên đã chết). Truyền cho
 *     undici Agent → mọi kết nối TCP/TLS tái dùng IP đã resolve.
 *  2. KEEP-ALIVE: Agent giữ lại kết nối per-origin → ít lần DNS + TCP
 *     handshake, phản hồi nhanh hơn hẳn với upstream HTTPS xa.
 *  3. RETRY + TIMEOUT: `fetchUpstream()` — timeout tường minh (mặc định 20s,
 *     0 = không giới hạn cho SSE), retry ĐÚNG 1 lần khi lỗi pha kết nối
 *     (DNS/refused/reset trước header — request chưa thực thi ở upstream).
 *     Timeout trả TimeoutError để route đổi sang 504 (không 502 chung chung).
 *  4. HEALTH TRACKER: ghi ok/lỗi/latency gần nhất theo nhãn upstream —
 *     /healthz đọc để chẩn đoán không cần probe thêm.
 */

import dns from 'node:dns';
import { Agent, setGlobalDispatcher } from 'undici';

// ----------------------------------------------------------------- DNS cache

const DNS_TTL_MS = 60 * 1000; // IP tốt — dùng lại 1 phút
const DNS_ERR_TTL_MS = 5 * 1000; // resolve hỏng — nhớ nhắn để không retry dồn
const DNS_MAX_ENTRIES = 256;

const dnsCache = new Map(); // hostname → { expiresAtMs, addresses|error }
const dnsStats = { hits: 0, misses: 0, errors: 0, evictions: 0 };

function dnsCacheGet(hostname) {
  const hit = dnsCache.get(hostname);
  if (!hit) return null;
  if (Date.now() >= hit.expiresAtMs) {
    dnsCache.delete(hostname);
    return null;
  }
  return hit;
}

function dnsCacheSet(hostname, entry) {
  if (dnsCache.size >= DNS_MAX_ENTRIES) {
    // Đủ chỗ cho mọi hostname upstream thực tế — dọn mục hết hạn trước, xoá
    // cũ nhất nếu vẫn đầy (tránh phình khi upstream đổi tên nhiều).
    for (const [key, value] of dnsCache) {
      if (Date.now() >= value.expiresAtMs) dnsCache.delete(key);
    }
    if (dnsCache.size >= DNS_MAX_ENTRIES) {
      dnsCache.delete(dnsCache.keys().next().value);
      dnsStats.evictions += 1;
    }
  }
  dnsCache.set(hostname, entry);
}

/**
 * `lookup` theo chuẩn callback của `net.connect` — truyền vào undici Agent.
 * `options.all = true` (undici dùng để lấy cả IPv4/IPv6 cho happy-eyeballs),
 * trả mảng { address, family }. `all = false` trả address đầu tiên.
 */
export function lookup(hostname, options, callback) {
  const opts = typeof options === 'function' ? { all: false } : options || {};
  const isAll = Boolean(opts.all);
  const onDone = typeof options === 'function' ? options : callback;

  const cachedEntry = dnsCacheGet(hostname);
  if (cachedEntry) {
    dnsStats.hits += 1;
    if (cachedEntry.error) {
      const err = cachedEntry.error;
      process.nextTick(() => onDone(err));
      return;
    }
    const addresses = cachedEntry.addresses;
    process.nextTick(() =>
      onDone(null, isAll ? addresses : addresses[0]?.address ?? null)
    );
    return;
  }

  dnsStats.misses += 1;
  dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
    if (err) {
      dnsStats.errors += 1;
      dnsCacheSet(hostname, { expiresAtMs: Date.now() + DNS_ERR_TTL_MS, error: err });
      onDone(err);
      return;
    }
    const sorted = addresses || [];
    dnsCacheSet(hostname, { expiresAtMs: Date.now() + DNS_TTL_MS, addresses: sorted });
    onDone(null, isAll ? sorted : sorted[0]?.address ?? null);
  });
}

/** Cho /healthz — dung lượng + hiệu quả cache DNS. */
export function dnsCacheStatus() {
  return { entries: dnsCache.size, ...dnsStats };
}

// ------------------------------------------------------- dispatcher keep-alive

// Lookup cache + keep-alive lâu hơn mặc định undici (4s) — upstream xa, chi phí
// TLS handshake lớn, giữ sóng kết nối đáng hơn rủi ro idle bị đóng.
const agent = new Agent({
  connect: { lookup, timeout: 10 * 1000 },
  keepAliveTimeout: 30 * 1000,
  keepAliveMaxTimeout: 10 * 60 * 1000,
});
setGlobalDispatcher(agent);
// Mọi `fetch()` trong process (server.mjs + token-manager.mjs) đi qua agent.

// ------------------------------------------------------- fetchUpstream + retry

const CONNECT_PHASE_HINTS = [
  'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT',
  'EHOSTUNREACH', 'ENETUNREACH', 'UND_ERR_CONNECT_TIMEOUT', 'OTHER_ERROR',
];

/** Lỗi mạng pha kết nối (chưa gửi request tới upstream) → được phép retry. */
function isConnectPhaseError(err) {
  if (!(err instanceof TypeError || err?.code)) return false;
  const text = `${err.code || ''} ${err.message || ''}`;
  return CONNECT_PHASE_HINTS.some((hint) => text.includes(hint));
}

// ---------------------------------------------------------------- health tracker

const upstreamHealth = new Map(); // nhãn → { lastOkAtMs, lastErrorAtMs, lastError, lastLatencyMs }

function recordHealth(label, ok, latencyMs, error) {
  const entry = upstreamHealth.get(label) || {};
  if (ok) {
    entry.lastOkAtMs = Date.now();
    entry.lastLatencyMs = Math.round(latencyMs);
    entry.lastError = undefined;
    entry.lastErrorAtMs = undefined;
  } else {
    entry.lastErrorAtMs = Date.now();
    entry.lastError = String(error?.message || error || 'unknown');
  }
  upstreamHealth.set(label, entry);
}

/** Cho /healthz — trạng thái theo nhãn upstream đã ghi từ traffic thật. */
export function upstreamHealthStatus() {
  const now = Date.now();
  const out = {};
  for (const [label, entry] of upstreamHealth) {
    out[label] = {
      lastOkAgoSec: entry.lastOkAtMs ? Math.round((now - entry.lastOkAtMs) / 1000) : null,
      lastLatencyMs: entry.lastLatencyMs ?? null,
      lastErrorAgoSec: entry.lastErrorAtMs ? Math.round((now - entry.lastErrorAtMs) / 1000) : null,
      lastError: entry.lastError ?? null,
    };
  }
  return out;
}

/**
 * fetch qua dispatcher chung + timeout + retry.
 *
 * @param {string} url  URL upstream đầy đủ
 * @param {object} init fetch init (method/headers/body/signal…)
 * @param {object} [opts]
 * @param {string} [opts.label]       nhãn health (vd 'finserver')
 * @param {number} [opts.timeoutMs]   mặc định 20s; 0 = không giới hạn (SSE)
 * @param {number} [opts.retries]     số lần retry thêm (mặc định 1) — chỉ khi
 *                                    lỗi pha kết nối, không retry lỗi giữa
 *                                    stream vì upstream có thể đã thực thi
 * @returns {Promise<Response>} Response của fetch (body chưa đọc)
 */
export async function fetchUpstream(url, init = {}, opts = {}) {
  const label = opts.label || new URL(url).host;
  const timeoutMs = opts.timeoutMs === undefined ? 20 * 1000 : opts.timeoutMs;
  const retries = opts.retries === undefined ? 1 : opts.retries;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const startedAt = Date.now();
    // AbortSignal.timeout trộn với signal client (SSE/static hủy theo client):
    // signal ngoài đã có → tôn trọng, thêm timeout bằng AbortSignal.any.
    const signals = [];
    if (timeoutMs > 0) signals.push(AbortSignal.timeout(timeoutMs));
    if (init.signal) signals.push(init.signal);
    const signal = signals.length === 0 ? undefined : AbortSignal.any(signals);

    try {
      const res = await fetch(url, { ...init, signal });
      recordHealth(label, true, Date.now() - startedAt);
      return res;
    } catch (err) {
      // Client ngắt kết nối (đang đọc stream/client đóng tab) → không phải
      // lỗi upstream: ném lại nguyên, không ghi health, không retry.
      if (init.signal?.aborted) throw err;
      lastErr = err;
      const isTimeout = err?.name === 'TimeoutError';
      if (isTimeout || attempt >= retries || !isConnectPhaseError(err)) {
        recordHealth(label, false, Date.now() - startedAt, err);
        throw err;
      }
      // Lỗi pha kết nối — chờ ngắn rồi thử lại (DNS vừa lỗi có thể nhường
      // chỗ cho bản ghi tốt hơn; keep-alive pool tự mở kết nối mới).
      recordHealth(label, false, Date.now() - startedAt, err);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  /* cống: vòng lặp luôn return/throw */
  throw lastErr;
}

/** Lỗi timeout (AbortSignal.timeout) — route dùng để trả 504 thay vì 502. */
export function isTimeoutError(err) {
  return err?.name === 'TimeoutError';
}
