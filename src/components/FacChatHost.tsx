import { useEffect, useRef, useState } from 'react';
import { FAC_HOST_CSS } from '../lib/facHostCss';

/**
 * Nhúng Financial Agent Chat (FAC) vào trang đối tác.
 *
 * FAC là một IIFE remote, nạp xong thì gắn `window.FacAgentChat.mount()`; mount
 * tự tạo shadow root bên trong host div nên ở đây không đụng gì tới shadow.
 *
 * Hai điểm khác bản trong WebApp:
 *  - Script nạp từ `/embedded/fac-chat.js` của proxy, không phải domain AUTOFIN.
 *  - `apiBase` trỏ về chính origin này, nên FAC gọi `{origin}/api/v1/*` và proxy
 *    tự gắn token. Trình duyệt không giữ token nào.
 */

const BUNDLE_URL = '/embedded/fac-chat.js';

interface FacHandle {
  /** Shadow root mở mà FAC gắn vào host div — dùng để tiêm CSS. */
  shadow?: ShadowRoot;
  setProps: (props: {
    theme?: 'light' | 'dark';
    locale?: 'vi' | 'en';
    hostCss?: string;
  }) => void;
  unmount: () => void;
}

/**
 * Tiêm CSS trực tiếp vào shadow root, bên cạnh `mount({ hostCss })`.
 *
 * Giữ cả hai đường vì bundle FAC đang được phục vụ có thể cũ hơn hợp đồng
 * `hostCss` của mount. Idempotent, nên trùng lặp cũng vô hại.
 */
function injectHostCss(shadow: ShadowRoot | undefined, css: string) {
  if (!shadow || !css) return;
  let style = shadow.querySelector<HTMLStyleElement>('style[data-fac-host-partner]');
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('data-fac-host-partner', '');
    shadow.appendChild(style);
  }
  style.textContent = css;
}

declare global {
  interface Window {
    FacAgentChat?: {
      mount: (host: HTMLElement, options: Record<string, unknown>) => FacHandle;
    };
  }
}

/** Nạp bundle đúng một lần, kể cả khi có nhiều instance cùng gọi. */
let bundlePromise: Promise<void> | null = null;

function loadBundle(): Promise<void> {
  if (window.FacAgentChat) return Promise.resolve();
  if (bundlePromise) return bundlePromise;

  const pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = BUNDLE_URL;
    script.async = true;
    script.onload = () =>
      window.FacAgentChat
        ? resolve()
        : reject(new Error('Bundle nạp xong nhưng thiếu window.FacAgentChat'));
    script.onerror = () =>
      reject(new Error(`Không nạp được ${BUNDLE_URL} — proxy chạy chưa?`));
    document.head.appendChild(script);
  }).catch((err) => {
    // Cho phép thử lại sau khi hỏng, thay vì kẹt promise lỗi vĩnh viễn.
    bundlePromise = null;
    throw err;
  });

  bundlePromise = pending;
  return pending;
}

export default function FacChatHost({
  height = 520,
  theme = 'light',
}: {
  height?: number;
  theme?: 'light' | 'dark';
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<FacHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadBundle()
      .then(() => {
        if (cancelled || !hostRef.current || handleRef.current) return;
        handleRef.current = window.FacAgentChat!.mount(hostRef.current, {
          // Cùng origin với trang → mọi lời gọi đi qua proxy, proxy gắn token.
          apiBase: window.location.origin,
          locale: 'vi',
          theme,
          layout: 'embedded',
          hideHeader: false,
          hideInlineError: true,
          historyPosition: 'right',
          hideAgentSelector: true,
          defaultAgentName: 'expert_stock_agent',
          showAssetRail: false,
          collapsibleHistory: true,
          defaultHistoryCollapsed: true,
          hostCss: FAC_HOST_CSS,
        });
        injectHostCss(handleRef.current.shadow, FAC_HOST_CSS);
        // Shadow host nằm NGOÀI .fac-theme-root, nên attribute này là đường duy
        // nhất để CSS cấp host phản ứng theo theme. Giống FinFE.
        hostRef.current.setAttribute('data-theme', theme);
        setReady(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      if (handleRef.current) {
        try {
          handleRef.current.unmount();
        } catch (err) {
          console.error('Không unmount được FAC:', err);
        }
        handleRef.current = null;
      }
    };
  }, []);

  return (
    <div className="widget-card">
      <div className="widget-card-title">Widget Chat AI (FAC)</div>
      <div className="widget-host" style={{ height, position: 'relative' }}>
        <div
          ref={hostRef}
          className="agent-chat-remote"
          style={{ height: '100%', width: '100%' }}
        />
        {!ready && !error ? (
          <p className="muted" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            Đang nạp widget…
          </p>
        ) : null}
        {error ? (
          <p className="muted" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            {error}
          </p>
        ) : null}
      </div>
      <p className="muted">
        Bundle nạp từ <code>{BUNDLE_URL}</code> qua proxy; <code>apiBase</code> là
        origin của trang nên FAC gọi <code>/api/v1/*</code> về proxy và proxy gắn
        token của khách. Trình duyệt không giữ token nào.
      </p>
    </div>
  );
}
