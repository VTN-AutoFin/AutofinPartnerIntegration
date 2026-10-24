import ActionLog from '../components/ActionLog';
import WidgetHost from '../components/WidgetHost';
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
          thẳng vào trang đối tác. Riêng <code>overlay-stock-detail</code> giữ
          hành vi overlay gốc: mount là tự mở drawer Chi tiết cổ phiếu (bên
          trong widget), khối host chỉ hiển thị trạng thái.
        </>
      }
    >
      <WidgetHost
        productId="comp-stock-detail"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={720}
      />
      <WidgetHost
        productId="comp-financials"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={450}
      />
      <WidgetHost
        productId="comp-shareholders"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={450}
      />
      <WidgetHost
        productId="comp-profile"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={450}
      />
      <WidgetHost
        productId="comp-news"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={450}
      />
      <WidgetHost
        productId="overlay-stock-detail"
        partnerCode={PARTNER_CODE}
        symbol="FPT"
        height={320}
      />
      <ActionLog />
    </PageScaffold>
  );
}
