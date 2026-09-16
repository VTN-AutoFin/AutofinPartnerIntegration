import ActionLog from '../components/ActionLog';
import CodeBlock from '../components/CodeBlock';
import ProxyApiDemo from '../components/ProxyApiDemo';
import WidgetHost from '../components/WidgetHost';
import { mountSnippet } from '../lib/snippet';
import PageScaffold from './PageScaffold';

export default function StockFilterPage() {
  return (
    <PageScaffold
      title="Widget Bộ lọc cổ phiếu (stock-filter)"
      intro={
        <>
          Ví dụ truyền <code>features: {'{ internalOverlays: false }'}</code> — widget
          không tự mở popup chi tiết, mọi sự kiện đi hết qua <code>onPartnerAction</code> để
          site đối tác tự điều hướng.
        </>
      }
    >
      <WidgetHost
        productId="stock-filter"
        partnerCode="YOUR_PARTNER_CODE"
        height={480}
        features={{ internalOverlays: false }}
      />
      <ActionLog />
      <ProxyApiDemo path="/api/gw/v1/search" description="Endpoint tìm kiếm mã — widget gọi cùng đường dẫn này qua proxy." />
      <CodeBlock
        code={mountSnippet(
          'stock-filter',
          `\n      features: { internalOverlays: false },`
        )}
      />
    </PageScaffold>
  );
}
