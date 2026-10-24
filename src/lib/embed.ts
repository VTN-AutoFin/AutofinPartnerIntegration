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
  | 'comp-stock-detail'
  | 'comp-financials'
  | 'comp-shareholders'
  | 'comp-profile'
  | 'comp-news'
  | 'overlay-stock-detail'
  | 'overlay-index-detail'
  | 'overlay-industry-detail'
  | 'chatpanel'
  | string;

/**
 * Bộ lọc phổ tín hiệu cho menu-signals / comp-signals — mirror
 * EmbedSignalFilterOption (WebApp packages/embed/src/types.ts), hợp lệ theo
 * signalFilterPolicy cấu hình trên FinAdmin.
 */
export type EmbedSignalFilterOption = {
  taxonomy: 'INDEX_BASKET' | 'ICB_4_LEVEL' | 'GICS_4_LEVEL';
  code: string;
  level?: 1 | 2 | 3 | 4;
  symbols?: string[];
};

/**
 * Ghi đè chuỗi i18n từ host (org language mapping) — deep-merge vào resource
 * i18n của widget. Mount sau ghi đè key trùng. Mirror EmbedI18nOverrides.
 */
export type EmbedI18nOverrides = {
  vi?: Record<string, unknown>;
  en?: Record<string, unknown>;
};

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
  /** Mã chứng khoán cho widget theo mã (comp-stock-detail, comp-financials,
   *  comp-shareholders, comp-profile, comp-news, overlay-stock-detail).
   *  overlay-index-detail / overlay-industry-detail: id chỉ số/ngành
   *  (VNINDEX / INDUST_ALL). Đổi lúc chạy: handle.setProps({ symbol: 'VCB' }). */
  symbol?: string;
  /** Bộ lọc phổ tín hiệu cho menu-signals / comp-signals (mirror signalFilter). */
  signalFilter?: EmbedSignalFilterOption | null;
  /**
   * Token truy cập widget gắn vào header `Authorization` của mọi call dữ liệu.
   * HOST tự lấy token ngắn hạn server-side (POST /api/org/token, Basic
   * clientId:clientSecret — secret không bao giờ xuống trình duyệt) rồi truyền
   * vào đây. Không truyền client secret / refresh token dài hạn.
   */
  token?: string;
  /**
   * CSS host tiêm vào shadow root SAU CSS gốc của app (thắng tie theo thứ tự
   * nguồn). Dùng bởi service mapping theme của tổ chức.
   */
  hostCss?: string;
  /** Ghi đè i18n từ host (mục ngôn ngữ của mapping theme), deep-merge vào bundle. */
  i18nOverrides?: EmbedI18nOverrides;
  /**
   * Cấu hình runtime (CHỈ các key env embed nằm trong allowlist — secret bị từ
   * chối). Áp dụng lại mỗi mount/setProps. Đối tác thông thường bỏ trống.
   */
  config?: Record<string, string>;
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

/** Mã tổ chức do AUTOFIN cấp. Đặt VITE_PARTNER_CODE trong .env. */
export const PARTNER_CODE: string =
  (import.meta.env.VITE_PARTNER_CODE as string | undefined)?.trim() ||
  'YOUR_PARTNER_CODE';

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
        // Demo workaround cho bug embed bundle: themeRoot trong shadow không có
        // height constraint → chuỗi h-full của surface resolve theo content height
        // (auto-giãn) → LayoutScrollBar không bao giờ overflow → widget cao cố
        // định bị cắt cụt, mất scroll. Fix gốc thuộc về WebApp packages/embed
        // (mount.tsx phải tự set themeRoot height 100% + rebuild bundle).
        if (handle.shadow) {
          const style = document.createElement('style');
          style.setAttribute('data-af-demo-height-fix', '1');
          style.textContent = `
            [data-autofin-theme-root]{height:100% !important}
            /* wrapper không class giữa mountNode(display:contents) và af-embed-surface — height:auto */
            [data-autofin-theme-root] > * > * { height: 100%; }
          `;
          handle.shadow.appendChild(style);
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
      handleRef.current?.unmount();
      handleRef.current = null;
    };
    // mount lại khi đổi productId/locale/theme/partnerCode
  }, [enabled, opts.productId, opts.locale, opts.theme, opts.partnerCode]);

  return { containerRef, status, error };
}
