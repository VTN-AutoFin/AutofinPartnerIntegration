/**
 * Kiểu + helper nạp AUTOFIN Embed SDK.
 * Contract mirror từ WebApp: packages/embed/src/types.ts + mount.tsx.
 */
import { useEffect, useRef, useState } from 'react';

export type EmbedLocale = 'vi' | 'en';
export type EmbedTheme = 'light' | 'dark';

export type EmbedProductId =
  | 'menu-derivatives'
  | 'menu-signals'
  | 'menu-reports'
  | 'menu-news'
  | 'menu-board'
  | 'stock-filter'
  | 'comp-signals'
  | 'comp-reports'
  | 'overlay-stock-detail'
  | 'overlay-index-detail'
  | 'overlay-industry-detail'
  | 'chatpanel'
  | string;

export type PartnerActionEvent = {
  type: string; // 'stock.detail_open' | 'stock.order_cta' | 'signal.order_cta' | ...
  partnerCode: string;
  productId: string;
  locale: EmbedLocale;
  symbol: string;
  exchange?: string;
  companyName?: string;
  lastPrice?: number;
  changePercent?: number;
  side?: 'BUY' | 'SELL';
  price?: number;
  signalId?: string;
  context?: Record<string, string | number | boolean | null>;
  ts: number;
};

export type PartnerActionHandler = (event: PartnerActionEvent) => void;

export type AutofinEmbedMountOptions = {
  el: string | HTMLElement;
  productId: EmbedProductId;
  locale?: EmbedLocale;
  partnerCode: string;
  dataProviderId?: string;
  /** Domain proxy công khai của đối tác. Trống = cùng origin (site này). */
  apiBase?: string;
  theme?: EmbedTheme;
  onPartnerAction?: PartnerActionHandler;
  features?: { internalOverlays?: boolean };
};

export type AutofinEmbedHandle = {
  unmount: () => void;
  setProps: (next: Partial<AutofinEmbedMountOptions>) => void;
  el: HTMLElement;
  shadow: ShadowRoot | null;
};

export type AutofinEmbedApi = {
  version: string;
  mount: (opts: AutofinEmbedMountOptions) => AutofinEmbedHandle | null;
  autoMount: () => void;
  on: (event: 'partnerAction', handler: PartnerActionHandler) => () => void;
  off: (event: 'partnerAction', handler: PartnerActionHandler) => void;
  emitPartnerAction: (event: PartnerActionEvent) => void;
};

declare global {
  interface Window {
    AutofinEmbed?: AutofinEmbedApi;
  }
}

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') || '';

export const PARTNER_CODE = 'DEMO';

// ------------------------------------------------------------- load SDK once

let sdkPromise: Promise<AutofinEmbedApi> | null = null;

/** Inject /embedded/autofin-embed.js đúng 1 lần; resolve window.AutofinEmbed. */
export function loadEmbedSdk(): Promise<AutofinEmbedApi> {
  if (window.AutofinEmbed) return Promise.resolve(window.AutofinEmbed);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${API_BASE}/embedded/autofin-embed.js`;
    script.async = true;
    script.onload = () => {
      if (window.AutofinEmbed?.mount) resolve(window.AutofinEmbed);
      else reject(new Error('SDK nạp xong nhưng thiếu window.AutofinEmbed.mount'));
    };
    script.onerror = () =>
      reject(
        new Error(
          `Không nạp được SDK ${script.src} — proxy chạy chưa (npm run dev:proxy)?`
        )
      );
    document.head.appendChild(script);
  });
  return sdkPromise;
}

// ------------------------------------------------------------------ React hook

export type UseAutofinEmbedOptions = Omit<AutofinEmbedMountOptions, 'el'> & {
  enabled?: boolean;
};

/**
 * Mount widget vào container, unmount sạch khi unmount trang / đổi props.
 * Trả về containerRef — gắn lên div host.
 * LƯU Ý: không truyền token/secret vào mount() — proxy gắn token server-side.
 */
export function useAutofinEmbed(opts: UseAutofinEmbedOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<AutofinEmbedHandle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const enabled = opts.enabled !== false;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    setStatus('loading');
    setError(null);

    loadEmbedSdk()
      .then((sdk) => {
        if (cancelled || !containerRef.current) return;
        const mountOpts = optsRef.current;
        const handle = sdk.mount({
          ...mountOpts,
          el: containerRef.current,
          apiBase: mountOpts.apiBase ?? API_BASE,
        });
        if (!handle) {
          setStatus('error');
          setError('mount() trả về null — kiểm tra console.');
          return;
        }
        handleRef.current = handle;
        setStatus('ready');
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setStatus('error');
        setError(e.message);
      });

    return () => {
      cancelled = true;
      handleRef.current?.unmount();
      handleRef.current = null;
    };
    // mount lại khi đổi productId/locale/theme/partnerCode
  }, [enabled, opts.productId, opts.locale, opts.theme, opts.partnerCode]);

  return { containerRef, status, error };
}
