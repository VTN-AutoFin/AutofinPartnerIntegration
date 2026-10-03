import CodeBlock from '../components/CodeBlock';
import { useFacChat } from '../lib/facChat';
import PageScaffold from './PageScaffold';

/**
 * FAC ChatPanel — SDK riêng (window.FacAgentChat, bundle fac-chat.js).
 * Widget chat AI: tự nói chuyện với FAC backend QUA PROXY (/api/v1/*),
 * không cần partnerCode/productId như AutofinEmbed.
 */
export default function ChatPanelPage() {
  const { containerRef, status, error } = useFacChat({
    apiBase: '', // cùng origin — proxy forward /api/v1/* sang FAC backend
    locale: 'vi',
    layout: 'embedded',
    collapsibleHistory: true,
    defaultHistoryCollapsed: true,
    hideAgentSelector: true,
    defaultAgentName: 'expert_stock_agent',
    notify: {
      notify: (severity, message) => console.log(`[FAC ${severity}]`, message),
      dismiss: () => {},
    },
  });

  return (
    <PageScaffold
      title="FAC ChatPanel (chat AI)"
      intro={
        <>
          Widget chat AI dùng SDK riêng <code>window.FacAgentChat</code> (bundle{' '}
          <code>fac-chat.js</code>, Shadow DOM). Khác AutofinEmbed: không cần{' '}
          <code>productId</code>/<code>partnerCode</code>; API chat đi qua proxy tại{' '}
          <code>/api/v1/*</code>. <code>hostCss</code> cho phép đổi màu theo thương hiệu.
        </>
      }
    >
      <div className="widget-card">
        <div className="widget-card-title">FacAgentChat — layout embedded</div>
        <div ref={containerRef} className="widget-host" style={{ height: 600 }} />
        {status === 'loading' ? <div className="widget-status">Đang nạp fac-chat.js…</div> : null}
        {status === 'error' ? <div className="widget-status err">Lỗi: {error}</div> : null}
        <p className="muted" style={{ marginTop: 8 }}>
          Chat chạy thật cần FAC backend (:8002) qua proxy — xem Network: mọi request
          /api/v1/* đều tới origin này.
        </p>
      </div>

      <CodeBlock
        code={`<!-- 1. Load FAC remote bundle QUA PROXY -->
<script src="/embedded/fac-chat.js" defer crossorigin="anonymous"></script>

<!-- 2. Host container -->
<div id="af-chatpanel" style="height:600px;width:100%"></div>

<!-- 3. Mount -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.FacAgentChat || !window.FacAgentChat.mount) {
      console.error('[FAC] ChatPanel SDK failed to load');
      return;
    }

    // Điều hướng toast FAC ra hệ thống thông báo của trang đối tác
    function handleFacNotify(severity, message, opts) {
      console.log('[FAC ' + severity + ']', message, opts);
      // yourToast.show({ type: severity, message, id: opts?.id });
    }
    function handleFacDismiss(id) { /* yourToast.dismiss(id); */ }

    var handle = window.FacAgentChat.mount(document.getElementById('af-chatpanel'), {
      apiBase: '',                    // cùng origin — proxy forward /api/v1/*
      locale: 'vi',
      layout: 'embedded',             // 1 cột, gọn trong khối
      hideHeader: false,
      collapsibleHistory: true,
      defaultHistoryCollapsed: true,
      hideAgentSelector: true,
      defaultAgentName: 'expert_stock_agent',
      // hostCss: ':root { --color-primary: #0055aa; }', // đổi thương hiệu
      notify: { notify: handleFacNotify, dismiss: handleFacDismiss },
    });
    // handle.setProps({ theme: 'dark' }) · handle.unmount()
  });
</script>`}
      />
    </PageScaffold>
  );
}
