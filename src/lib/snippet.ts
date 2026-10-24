/**
 * Sinh snippet nhúng (HTML thuần) — cùng pattern với snippet đối tác copy từ
 * console AUTOFIN (buildEmbedSnippet). Dùng cho tab CodeBlock mỗi trang ví dụ.
 */
import { API_BASE, PARTNER_CODE } from './embed';

/** Chiều cao mặc định theo product — mirror EMBED_WIDGET_DEFAULT_HEIGHT bên
 *  WebApp (comp-stock-detail 720, overlay-index/industry-detail 900). */
const DEFAULT_HEIGHT: Record<string, number> = {
  'comp-stock-detail': 720,
  'overlay-index-detail': 900,
  'overlay-industry-detail': 900,
};

export function mountHeight(productId: string): number {
  return DEFAULT_HEIGHT[productId] ?? 450;
}

/** Dòng `features: { … }` để chèn vào snippet qua tham số `extra`. */
export function featuresLine(features?: Record<string, unknown>): string {
  if (!features || !Object.keys(features).length) return '';
  const body = Object.entries(features)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(', ');
  return `\n      features: { ${body} },`;
}

export function mountSnippet(
  productId: string,
  extra = '',
  opts: { symbol?: string; height?: number } = {}
): string {
  const apiBase = API_BASE || 'https://api.tenmien-doitac.vn';
  const height = opts.height ?? mountHeight(productId);
  const symbolLine = opts.symbol
    ? `\n      symbol: '${opts.symbol}', // đổi lúc chạy: handle.setProps({ symbol: 'VCB' })`
    : '';
  return `<!-- 1. Load SDK từ domain proxy -->
<script src="${apiBase}/embedded/autofin-embed.js" defer></script>

<!-- 2. Khối chứa widget -->
<div id="af-widget-${productId}" style="height:${height}px;width:100%"></div>

<!-- 3. Mount -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.AutofinEmbed || !window.AutofinEmbed.mount) {
      console.error('[AUTOFIN] Không nạp được SDK');
      return;
    }

    window.AutofinEmbed.mount({
      el: '#af-widget-${productId}',
      productId: '${productId}',
      locale: 'vi',
      partnerCode: '${PARTNER_CODE}',
      dataProviderId: 'AUTOFIN',
      apiBase: '${apiBase}',${symbolLine}${extra}

      onPartnerAction: function (event) {
        console.log('[AUTOFIN ${productId}]', event);
      },
    });
  });
</script>`;
}
