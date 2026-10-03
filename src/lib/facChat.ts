/**
 * FAC ChatPanel SDK loader — contract mirror từ FAC frontend
 * (FinancialAgentComposer/frontend/src/remote/mount.tsx, bundle /remote/fac-chat.js).
 * SDK script luôn nạp QUA PROXY (/embedded/fac-chat.js) — browser không biết FAC host.
 */
import { useEffect, useRef, useState } from 'react';

export type FacNotify = (severity: string, message: string, opts?: { id?: string; description?: string }) => void;

export type FacChatMountProps = {
  apiBase?: string;
  locale?: 'vi' | 'en';
  theme?: 'light' | 'dark';
  layout?: 'full' | 'embedded';
  hideHeader?: boolean;
  hideInlineError?: boolean;
  historyPosition?: 'left' | 'right';
  collapsibleHistory?: boolean;
  defaultHistoryCollapsed?: boolean;
  hideAgentSelector?: boolean;
  defaultAgentName?: string;
  showAssetRail?: boolean;
  hostCss?: string;
  onClose?: () => void;
  notify?: { notify: FacNotify; dismiss: (id?: string) => void };
};

export type FacChatHandle = {
  setProps: (next: Partial<FacChatMountProps>) => void;
  unmount: () => void;
};

type FacChatApi = { mount: (el: HTMLElement, props: FacChatMountProps) => FacChatHandle | null };

declare global {
  interface Window {
    FacAgentChat?: FacChatApi;
  }
}

let facPromise: Promise<FacChatApi> | null = null;

/** Inject /embedded/fac-chat.js đúng 1 lần; resolve window.FacAgentChat. */
export function loadFacChatSdk(): Promise<FacChatApi> {
  if (window.FacAgentChat?.mount) return Promise.resolve(window.FacAgentChat);
  if (facPromise) return facPromise;

  facPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/embedded/fac-chat.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.FacAgentChat?.mount) resolve(window.FacAgentChat);
      else reject(new Error('fac-chat.js nạp xong nhưng thiếu window.FacAgentChat.mount'));
    };
    script.onerror = () =>
      reject(new Error('Không nạp được fac-chat.js — FAC frontend (:5173) và proxy (:5501) chạy chưa?'));
    document.head.appendChild(script);
  });
  return facPromise;
}

/** Mount FAC chatpanel vào container; unmount sạch khi unmount trang. */
export function useFacChat(props: FacChatMountProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    let cancelled = false;
    let handle: FacChatHandle | null = null;

    setStatus('loading');
    setError(null);

    loadFacChatSdk()
      .then((sdk) => {
        if (cancelled || !containerRef.current) return;
        handle = sdk.mount(containerRef.current, propsRef.current);
        if (!handle) {
          setStatus('error');
          setError('FacAgentChat.mount() trả về null — kiểm tra console.');
          return;
        }
        setStatus('ready');
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setStatus('error');
        setError(e.message);
      });

    return () => {
      cancelled = true;
      handle?.unmount();
      handle = null;
    };
  }, []);

  return { containerRef, status, error };
}
