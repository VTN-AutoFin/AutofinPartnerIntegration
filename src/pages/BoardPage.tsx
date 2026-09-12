import ActionLog from '../components/ActionLog';
import CodeBlock from '../components/CodeBlock';
import ProxyApiDemo from '../components/ProxyApiDemo';
import WidgetHost from '../components/WidgetHost';
import { mountSnippet } from '../lib/snippet';
import PageScaffold from './PageScaffold';

export default function BoardPage() {
  return (
    <PageScaffold
      title="Widget Bảng điện (menu-board)"
      intro="Bảng điện thị trường — full width. Nhiều widget cùng loại vẫn mount bình thường trên 1 trang."
    >
      <WidgetHost productId="menu-board" partnerCode="DEMO" height={520} />
      <ActionLog />
      <ProxyApiDemo path="/api/gw/v1/market/index-all" description="Chỉ số HVX toàn sàn — proxy tự gắn machine token." />
      <CodeBlock code={mountSnippet('menu-board')} />
    </PageScaffold>
  );
}
