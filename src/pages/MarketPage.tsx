import ActionLog from '../components/ActionLog';
import WidgetHost from '../components/WidgetHost';
import PageScaffold from './PageScaffold';
import { PARTNER_CODE } from '../lib/embed';

/**
 * Widget chỉ số thị trường / ngành — nhúng inline (không còn là overlay
 * fullscreen). `symbol` nhận id chỉ số (VNINDEX…) hoặc id ngành INDUST_<n>
 * (INDUST_1=Năng lượng, INDUST_6=Tài chính…); bỏ trống widget dùng mặc định
 * VNINDEX / INDUST_ALL.
 *
 * LƯU Ý: `INDUST_ALL` là tên exchange (nhóm toàn bộ ngành trên TV symbol
 * search), KHÔNG phải symbol vẽ được — biểu đồ sẽ "Không có dữ liệu". Dùng
 * INDUST_<n> lấy từ /api/gw/v1/market/symbols?type=4 (exchange=INDUST_ALL).
 */
export default function MarketPage() {
  return (
    <PageScaffold
      title="Widget chỉ số thị trường & ngành (overlay-index/industry-detail)"
      intro={
        <>
          Trước đây chỉ mở dưới dạng overlay chi tiết — giờ mount được{' '}
          <strong>inline</strong> như widget thường. <code>symbol</code> nhận id
          chỉ số (<code>VNINDEX</code>) hoặc id ngành <code>INDUST_&lt;n&gt;</code>{' '}
          — ví dụ <code>INDUST_6</code> = Ngành Tài chính (danh sách:{' '}
          <code>/api/gw/v1/market/symbols?type=4</code>). Chú ý{' '}
          <code>INDUST_ALL</code> là tên exchange, không vẽ được biểu đồ. Cao mặc
          định 900px (biểu đồ TradingView 600px + bảng top cổ phiếu).
        </>
      }
    >
      <WidgetHost
        productId="overlay-index-detail"
        partnerCode={PARTNER_CODE}
        symbol="VNINDEX"
        height={900}
      />
      <WidgetHost
        productId="overlay-industry-detail"
        partnerCode={PARTNER_CODE}
        symbol="INDUST_6"
        height={900}
        name="Chi tiết ngành · Tài chính"
      />
      <ActionLog />
    </PageScaffold>
  );
}
