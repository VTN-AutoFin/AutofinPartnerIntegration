import ActionLog from '../components/ActionLog';
import CodeBlock from '../components/CodeBlock';
import WidgetHost from '../components/WidgetHost';
import { mountSnippet } from '../lib/snippet';
import PageScaffold from './PageScaffold';
import { PARTNER_CODE } from '../lib/embed';

/**
 * Các widget chi tiết doanh nghiệp — tất cả nhận option `symbol` (mã CK,
 * ví dụ FPT/VCB). Đổi mã lúc chạy: handle.setProps({ symbol: 'VCB' }).
 */
export default function CompanyPage() {
  return (
    <PageScaffold
      title="Widget chi tiết doanh nghiệp (comp-*)"
      intro={
        <>
          Nhóm widget gắn theo <strong>mã chứng khoán</strong> — truyền{' '}
          <code>symbol: 'FPT'</code> khi mount, đổi lúc chạy bằng{' '}
          <code>handle.setProps({'{ symbol: "VCB" }'})</code>. Cùng khối nội dung
          với popup "Chi tiết cổ phiếu" trong app AUTOFIN, nhưng nhúng inline
          thẳng vào trang đối tác.
        </>
      }
    >
      <WidgetHost
        productId="comp-stock-detail"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={720}
        title="comp-stock-detail — Chi tiết cổ phiếu (tab giá / tài chính / công ty…)"
      />
      <WidgetHost
        productId="comp-financials"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={450}
        title="comp-financials — Báo cáo tài chính"
      />
      <WidgetHost
        productId="comp-shareholders"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={450}
        title="comp-shareholders — Cổ đông"
      />
      <WidgetHost
        productId="comp-profile"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={450}
        title="comp-profile — Hồ sơ doanh nghiệp"
      />
      <WidgetHost
        productId="comp-news"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={450}
        title="comp-news — Tin tức doanh nghiệp"
      />
      <ActionLog />
      <CodeBlock
        code={mountSnippet('comp-stock-detail', '', { symbol: 'FPT' })}
      />
    </PageScaffold>
  );
}
