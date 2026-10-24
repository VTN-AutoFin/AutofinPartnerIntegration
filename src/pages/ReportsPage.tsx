import ActionLog from '../components/ActionLog';
import CodeBlock from '../components/CodeBlock';
import WidgetHost from '../components/WidgetHost';
import { mountSnippet } from '../lib/snippet';
import PageScaffold from './PageScaffold';
import { PARTNER_CODE } from '../lib/embed';

/**
 * Widget Báo cáo — mirror ReportsMenuSurface (WebApp embed-surfaces):
 * menu đầy đủ (menu-reports, variant="full") và khối gọn (comp-reports,
 * variant="compact"). Cùng chrome widget dashboard (WidgetWrapper): title +
 * action bar (width/height/fullscreen/feedback). Không nhận `symbol`.
 */
export default function ReportsPage() {
  return (
    <PageScaffold
      title="Widget Báo cáo (menu-reports · comp-reports)"
      intro="Hai kiểu nhúng: menu báo cáo đầy đủ (menu-reports) và khối báo cáo gọn (comp-reports). Người xem thêm/bố trí biểu đồ ngay trong widget — không cần option `symbol`."
    >
      <WidgetHost productId="menu-reports" partnerCode={PARTNER_CODE} height={480} title="menu-reports — menu đầy đủ" />
      <WidgetHost productId="comp-reports" partnerCode={PARTNER_CODE} height={320} title="comp-reports — khối gọn" />
      <ActionLog />
      <CodeBlock code={mountSnippet('comp-reports')} />
    </PageScaffold>
  );
}
