import { useEffect } from 'react';
import ActionLog from '../components/ActionLog';
import CodeBlock from '../components/CodeBlock';
import { loadEmbedSdk, API_BASE, PARTNER_CODE } from '../lib/embed';
import PageScaffold from './PageScaffold';

/**
 * demo autoMount: thay vì gọi mount() thủ công, đặt attr data-autofin-product
 * lên div rồi gọi AutofinEmbed.autoMount() — SDK tự scan + mount toàn trang.
 */
export default function NewsPage() {
  useEffect(() => {
    let cancelled = false;
    loadEmbedSdk().then((sdk) => {
      if (!cancelled) sdk.autoMount();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const apiBase = API_BASE || 'https://api.tenmien-doitac.vn';

  return (
    <PageScaffold
      title="Widget Tin tức (menu-news — autoMount)"
      intro={
        <>
          Cách nhúng "không cần code": đặt <code>data-autofin-product</code> lên div,
          SDK tự mount khi gọi <code>autoMount()</code>. Phù hợp CMS/site tĩnh.
        </>
      }
    >
      <div className="widget-card">
        <div className="widget-card-title">menu-news — data-attr autoMount</div>
        <div
          className="widget-host"
          data-autofin-product="menu-news"
          data-locale="vi"
          data-partner-code={PARTNER_CODE}
          data-provider="AUTOFIN"
          data-api-base={API_BASE || undefined}
          style={{ height: 480 }}
        />
      </div>
      <ActionLog />
      <CodeBlock
        code={`<script src="${apiBase}/embedded/autofin-embed.js" defer></script>

<div
  data-autofin-product="menu-news"
  data-locale="vi"
  data-partner-code="${PARTNER_CODE}"
  data-provider="AUTOFIN"
  data-api-base="${apiBase}"
  style="height:480px"
></div>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    // SDK tự quét mọi [data-autofin-product] và mount
    window.AutofinEmbed && window.AutofinEmbed.autoMount();
  });
</script>`}
      />
    </PageScaffold>
  );
}
