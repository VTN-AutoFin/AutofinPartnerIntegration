/**
 * Sinh snippet nhúng (HTML thuần) — cùng pattern với snippet đối tác copy từ
 * console AUTOFIN (buildEmbedSnippet). Dùng cho tab CodeBlock mỗi trang ví dụ.
 */
import { API_BASE, PARTNER_CODE } from './embed';

export function mountSnippet(productId: string, extra = ''): string {
  const apiBase = API_BASE || 'https://api.tenmien-doitac.vn';
  return `<!-- 1. Load SDK từ domain proxy -->
<script src="${apiBase}/embedded/autofin-embed.js" defer></script>

<!-- 2. Khối chứa widget -->
<div id="af-widget-${productId}" style="height:450px;width:100%"></div>

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
      apiBase: '${apiBase}',${extra}

      onPartnerAction: function (event) {
        console.log('[AUTOFIN ${productId}]', event);
      },
    });
  });
</script>`;
}
