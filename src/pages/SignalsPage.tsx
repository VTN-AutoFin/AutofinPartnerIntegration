import ActionLog from '../components/ActionLog';
import ProxyApiDemo from '../components/ProxyApiDemo';
import WidgetHost from '../components/WidgetHost';
import PageScaffold from './PageScaffold';
import { PARTNER_CODE } from '../lib/embed';

export default function SignalsPage() {
  return (
    <PageScaffold
      title="Widget Tín hiệu (comp-signals · menu-signals)"
      intro="Hai kiểu nhúng: khối tín hiệu gọn (comp-signals) và menu đầy đủ (menu-signals)."
    >
      <WidgetHost productId="menu-signals" partnerCode={PARTNER_CODE} height={480} />
      <WidgetHost productId="comp-signals" partnerCode={PARTNER_CODE} height={320} />
      <ActionLog />
      <ProxyApiDemo path="/api/gw/v1/signals" />
    </PageScaffold>
  );
}
