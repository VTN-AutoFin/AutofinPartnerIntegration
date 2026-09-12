import ActionLog from '../components/ActionLog';
import CodeBlock from '../components/CodeBlock';
import ProxyApiDemo from '../components/ProxyApiDemo';
import WidgetHost from '../components/WidgetHost';
import { mountSnippet } from '../lib/snippet';
import PageScaffold from './PageScaffold';

export default function SignalsPage() {
  return (
    <PageScaffold
      title="Widget Tín hiệu (comp-signals · menu-signals)"
      intro="Hai kiểu nhúng: khối tín hiệu gọn (comp-signals) và menu đầy đủ (menu-signals)."
    >
      <WidgetHost productId="menu-signals" partnerCode="NGUYENPQ" height={480} title="menu-signals — menu đầy đủ" />
      <WidgetHost productId="comp-signals" partnerCode="NGUYENPQ" height={320} title="comp-signals — khối gọn" />
      <ActionLog />
      <ProxyApiDemo path="/api/gw/v1/signals" />
      <CodeBlock code={mountSnippet('comp-signals')} />
    </PageScaffold>
  );
}
