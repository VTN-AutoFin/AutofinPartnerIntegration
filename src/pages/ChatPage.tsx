import { useEffect, useState } from 'react';
import CodeBlock from '../components/CodeBlock';
import PageScaffold from './PageScaffold';

type Call = { label: string; status: number; ms: number; body: string };

const IDENTITY_KEYS = ['user_id', 'userId'];

/** Phần đối tác phải tự viết: đổi phiên khách của mình lấy token AUTOFIN. */
const CHAT_SNIPPET = `// Chạy trên SERVER của bạn. Trình duyệt không bao giờ thấy token.

// 1. Đổi id khách lấy token AUTOFIN
async function getTokenForVisitor(externalUserId) {
  const basic = Buffer.from(ORG_CLIENT_ID + ':' + ORG_CLIENT_SECRET).toString('base64');

  const res = await fetch(FIN_UPSTREAM + '/org/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + basic,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ externalUserId }),
  });

  const { data } = await res.json();
  return data.accessToken; // sống data.expiresIn giây — nên cache theo từng khách
}

// 2. Gắn token đó vào mọi request chat của khách
app.all('/api/gw/v1/chat/*', async (req, res) => {
  const externalUserId = req.session.userId; // ← lấy từ PHIÊN, không từ query/body
  if (!externalUserId) return res.sendStatus(401);

  const token = await getTokenForVisitor(externalUserId);
  forwardToAutofin(req, res, { Authorization: 'Bearer ' + token });
});

// forwardToAutofin + cache token: xem server/server.mjs và server/token-manager.mjs`;

/** Gọi qua cùng origin (proxy). Không gửi user_id: danh tính do server quyết. */
async function callApi(
  label: string,
  path: string,
  init?: RequestInit
): Promise<Call> {
  const started = performance.now();
  try {
    const res = await fetch(path, {
      cache: 'no-store',
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
    const text = await res.text();
    let body = text;
    try {
      body = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* giữ nguyên text */
    }
    return {
      label,
      status: res.status,
      ms: Math.round(performance.now() - started),
      body: body.slice(0, 4000),
    };
  } catch (e) {
    return {
      label,
      status: 0,
      ms: Math.round(performance.now() - started),
      body: String(e),
    };
  }
}

export default function ChatPage() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [draftVisitor, setDraftVisitor] = useState('kh-001');
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('VNINDEX hôm nay thế nào?');
  const [calls, setCalls] = useState<Call[]>([]);
  const [busy, setBusy] = useState(false);

  const push = (call: Call) => setCalls((prev) => [call, ...prev].slice(0, 8));

  const run = async (fn: () => Promise<Call>) => {
    setBusy(true);
    try {
      push(await fn());
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetch('/demo/me')
      .then((r) => r.json())
      .then((d) => setVisitorId(d.visitorId ?? null))
      .catch(() => setVisitorId(null));
  }, []);

  const login = async () => {
    setBusy(true);
    try {
      const res = await fetch('/demo/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: draftVisitor }),
      });
      const data = await res.json();
      setVisitorId(res.ok ? data.visitorId : null);
      if (!res.ok) push({ label: 'login', status: res.status, ms: 0, body: JSON.stringify(data, null, 2) });
      setSessionId('');
      setCalls([]);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch('/demo/logout', { method: 'POST' });
    setVisitorId(null);
    setSessionId('');
    setCalls([]);
  };

  return (
    <PageScaffold
      title="Widget Chat AI"
      intro={
        <>
          Widget duy nhất giữ <strong>lịch sử riêng cho từng khách</strong>. Proxy
          lấy id khách từ phiên phía server, đổi lấy token đã ký sẵn id đó, nên
          trình duyệt không thể tự nhận mình là khách khác.
        </>
      }
    >
      <div className="widget-card chat-form">
        <div className="widget-card-title">
          Phiên khách — thay cho hệ thống đăng nhập của đối tác
        </div>
        {visitorId ? (
          <div className="api-row">
            <code className="api-path">Đang là khách: {visitorId}</code>
            <button className="btn" onClick={logout} disabled={busy}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="api-row">
            <input
              value={draftVisitor}
              onChange={(e) => setDraftVisitor(e.target.value)}
              placeholder="id khách phía đối tác, ví dụ kh-001"
            />
            <button className="btn" onClick={login} disabled={busy}>
              Đăng nhập
            </button>
          </div>
        )}
        <p className="muted">
          Khi áp dụng thật, thay bằng phiên sẵn có của bạn. Điều bắt buộc giữ
          nguyên: id khách lấy từ phía server, không lấy từ dữ liệu trình duyệt
          gửi lên.
        </p>
      </div>

      <div className="widget-card">
        <div className="widget-card-title">Danh tính gửi xuống chat service</div>
        <div className="api-row">
          <code className="api-path">GET /api/gw/v1/chat/quota-remain</code>
          <button
            className="btn"
            disabled={busy || !visitorId}
            onClick={() =>
              run(() => callApi('danh tính của tôi', '/api/gw/v1/chat/quota-remain'))
            }
          >
            Xem danh tính
          </button>
        </div>
        <div className="api-row">
          <code className="api-path">…cùng endpoint, gửi kèm user_id người khác</code>
          <button
            className="btn"
            disabled={busy || !visitorId}
            onClick={() =>
              run(() =>
                callApi(
                  'thử mạo danh',
                  `/api/gw/v1/chat/quota-remain?${IDENTITY_KEYS.map(
                    (k) => `${k}=victim%40example.com`
                  ).join('&')}`
                )
              )
            }
          >
            Thử mạo danh
          </button>
        </div>
        <p className="muted">
          Hai nút phải trả về <strong>cùng một</strong> <code>user_id</code>. Lời
          gọi mạo danh vẫn thành công là đúng: cơ chế bảo vệ là ghi đè danh tính,
          không phải chặn request. Đổi sang khách khác thì <code>user_id</code>{' '}
          phải khác.
        </p>
      </div>

      <div className="widget-card chat-form">
        <div className="widget-card-title">Hội thoại</div>
        <div className="api-row">
          <code className="api-path">POST /api/gw/v1/chat/session</code>
          <button
            className="btn"
            disabled={busy || !visitorId}
            onClick={() =>
              run(async () => {
                const call = await callApi('tạo phiên', '/api/gw/v1/chat/session', {
                  method: 'POST',
                });
                try {
                  const parsed = JSON.parse(call.body);
                  const id =
                    parsed?.data?.session_id ?? parsed?.session_id ?? parsed?.data?.id;
                  if (id) setSessionId(String(id));
                } catch {
                  /* không parse được thì tự điền */
                }
                return call;
              })
            }
          >
            Tạo phiên
          </button>
        </div>

        <div className="api-row">
          <code className="api-path">GET /api/gw/v1/chat/session</code>
          <button
            className="btn"
            disabled={busy || !visitorId}
            onClick={() =>
              run(() =>
                callApi('danh sách phiên', '/api/gw/v1/chat/session?offset=0&limit=20')
              )
            }
          >
            Danh sách phiên
          </button>
        </div>

        <div className="api-row">
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="session_id"
          />
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="tin nhắn"
          />
          <button
            className="btn"
            disabled={busy || !visitorId || !sessionId}
            onClick={() =>
              run(() =>
                callApi(
                  'gửi tin',
                  `/api/gw/v1/chat/direct?session_id=${encodeURIComponent(sessionId)}`,
                  { method: 'POST', body: JSON.stringify({ message }) }
                )
              )
            }
          >
            Gửi tin
          </button>
        </div>

        <div className="api-row">
          <code className="api-path">GET /api/gw/v1/chat/history</code>
          <button
            className="btn"
            disabled={busy || !visitorId || !sessionId}
            onClick={() =>
              run(() =>
                callApi(
                  'lịch sử',
                  `/api/gw/v1/chat/history?session_id=${encodeURIComponent(sessionId)}`
                )
              )
            }
          >
            Lịch sử
          </button>
        </div>
      </div>

      <div className="widget-card">
        <div className="widget-card-title">Kết quả</div>
        <pre className="action-log">
          {calls.length
            ? calls
                .map((c) => `[${c.label}] HTTP ${c.status} · ${c.ms}ms\n${c.body}`)
                .join('\n\n────────\n\n')
            : 'Chưa có lời gọi nào.'}
        </pre>
      </div>

      <CodeBlock lang="js" code={CHAT_SNIPPET} />
    </PageScaffold>
  );
}
