import ActionLog from '../components/ActionLog';
import CodeBlock from '../components/CodeBlock';
import WidgetHost from '../components/WidgetHost';
import { mountSnippet } from '../lib/snippet';
import PageScaffold from './PageScaffold';
import { PARTNER_CODE } from '../lib/embed';

/**
 * Widget chỉ số thị trường / ngành — nhúng inline (không còn là overlay
 * fullscreen). `symbol` nhận id chỉ số (VNINDEX, HNXINDEX…) hoặc id ngành
 * (INDUST_ALL…); bỏ trống widget dùng mặc định VNINDEX / INDUST_ALL.
 */
export default function MarketPage() {
  return (
    <PageScaffold
      title="Widget chỉ số thị trường & ngành (overlay-index/industry-detail)"
      intro={
        <>
          Trước đây chỉ mở dưới dạng overlay chi tiết — giờ mount được{' '}
          <strong>inline</strong> như widget thường. <code>symbol</code> nhận id
          chỉ số (<code>VNINDEX</code>) hoặc id ngành (<code>INDUST_ALL</code>),
          mặc định <code>VNINDEX</code> / <code>INDUST_ALL</code> nếu bỏ trống.
          Cao mặc định 900px (biểu đồ TradingView 600px + bảng top cổ phiếu).
        </>
      }
    >
      <WidgetHost
        productId="overlay-index-detail"
        partnerCode={PARTNER_CODE}
        symbol="VNINDEX"
        height={900}
        title="overlay-index-detail — Chi tiết chỉ số thị trường (VNINDEX)"
      />
      <WidgetHost
        productId="overlay-industry-detail"
        partnerCode={PARTNER_CODE}
        symbol="INDUST_ALL"
        height={900}
        title="overlay-industry-detail — Chi tiết ngành (INDUST_ALL)"
      />
      <ActionLog />
      <CodeBlock
        code={mountSnippet('overlay-index-detail', '', { symbol: 'VNINDEX' })}
      />
    </PageScaffold>
  );
}
