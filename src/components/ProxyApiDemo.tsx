import { useState } from 'react';

type Result = { status: number; ms: number; body: string } | null;

/**
 * Gọi API NGAY TẠI TRANG qua cùng origin (proxy) — chứng minh browser chỉ thấy
 * domain proxy, không biết API nguồn. Đổi <path> sang bất kỳ endpoint nào
 * widget cần, proxy đều chuyển tiếp + tự gắn token.
 */
export default function ProxyApiDemo({
  path,
  description,
}: {
  path: string;
  description?: string;
}) {
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);

  const call = async () => {
    setLoading(true);
    const started = performance.now();
    try {
      const res = await fetch(path, { headers: { Accept: 'application/json' } });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* giữ nguyên text */
      }
      setResult({ status: res.status, ms: Math.round(performance.now() - started), body: pretty.slice(0, 4000) });
    } catch (e) {
      setResult({ status: 0, ms: Math.round(performance.now() - started), body: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="widget-card">
      <div className="widget-card-title">API qua proxy</div>
      {description ? <p className="muted">{description}</p> : null}
      <div className="api-row">
        <code className="api-path">GET {path}</code>
        <button className="btn" onClick={call} disabled={loading}>
          {loading ? 'Đang gọi…' : 'Gọi thử'}
        </button>
      </div>
      {result ? (
        <pre className="action-log" style={{ height: 220 }}>
          {`HTTP ${result.status} · ${result.ms}ms\n\n${result.body}`}
        </pre>
      ) : null}
    </div>
  );
}
