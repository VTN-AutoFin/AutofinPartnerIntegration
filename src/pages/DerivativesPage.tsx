import ActionLog from '../components/ActionLog';
import CodeBlock from '../components/CodeBlock';
import ProxyApiDemo from '../components/ProxyApiDemo';
import WidgetHost from '../components/WidgetHost';
import { mountSnippet } from '../lib/snippet';
import PageScaffold from './PageScaffold';

export default function DerivativesPage() {
  return (
    <PageScaffold
      title="Widget Phái sinh (menu-derivatives)"
      intro="Bảng giá hợp đồng tương lai. Mount 1 widget, nhận sự kiện CTA đặt lệnh phái sinh."
    >
      <WidgetHost productId="menu-derivatives" partnerCode="NGUYENPQ" height={480} />
      <ActionLog />
      <ProxyApiDemo
        path="/api/gw/v1/derivative/days-info"
        description="Cùng API widget dùng — nhưng browser chỉ gọi proxy (xem Network tab: không có request nào tới API nguồn)."
      />
      <CodeBlock code={mountSnippet('menu-derivatives')} />
    </PageScaffold>
  );
}
