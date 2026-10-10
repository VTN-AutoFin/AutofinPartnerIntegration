import { useEffect, useState } from 'react';

/**
 * VITE_ORG_END_USER_ID (build time) chọn góc nhìn của trang chat:
 *   CÓ giá trị → END-USER perspective: tự đăng nhập id đó qua /demo/login
 *     (nếu chưa có phiên khách) → chat per-visitor trong org.
 *   TRỐNG → PARTNER perspective: không tạo phiên khách — proxy forward nguyên
 *     vẹn Authorization, staff/partner đăng nhập FAC tự quản phiên panel.
 * Tích hợp thật: bỏ env — id khách do backend đối tác quyết định trong code.
 */
const ENV_END_USER_ID = (
  import.meta.env.VITE_ORG_END_USER_ID as string | undefined
)?.trim();

/** Đảm bảo phiên khách đúng góc nhìn cấu hình; trả về id (null = partner). */
export function useVisitorPerspective() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/demo/me')
      .then((r) => r.json())
      .then(async (d: { visitorId?: string | null }) => {
        if (d.visitorId) {
          if (alive) {
            setVisitorId(d.visitorId);
            setReady(true);
          }
          return;
        }
        if (ENV_END_USER_ID) {
          const r = await fetch('/demo/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorId: ENV_END_USER_ID }),
          });
          const data = (await r.json().catch(() => ({}))) as { visitorId?: string };
          if (alive) setVisitorId(r.ok ? data.visitorId ?? null : null);
        }
        if (alive) setReady(true);
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { visitorId, ready };
}
