import { useState } from 'react';
import type { PartnerActionEvent } from '../lib/embed';
import { loadEmbedSdk, API_BASE, PARTNER_CODE } from '../lib/embed';
import CodeBlock from '../components/CodeBlock';
import PageScaffold from './PageScaffold';
import { useEffect } from 'react';

/**
 * Demo callback "thật": bắt stock.order_cta / signal.order_cta rồi mở form đặt
 * lệnh MỤC ĐÍCH DEMO của site đối tác (không phải form AUTOFIN).
 * Widget sample gắn internalOverlays:false để mọi CTA đi qua callback.
 */
export default function CallbacksPage() {
  const [lastEvent, setLastEvent] = useState<PartnerActionEvent | null>(null);
  const [orderForm, setOrderForm] = useState<{ symbol: string; side: 'BUY' | 'SELL' } | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    loadEmbedSdk().then((sdk) => {
      const handle = sdk.mount({
        el: '#af-callback-widget',
        productId: 'comp-signals',
        locale: 'vi',
        partnerCode: PARTNER_CODE,
        dataProviderId: 'AUTOFIN',
        apiBase: API_BASE,
        features: { internalOverlays: false },
        onPartnerAction: (ev) => {
          setLastEvent(ev);
          if (ev.type === 'stock.order_cta' || ev.type === 'signal.order_cta') {
            setOrderForm({ symbol: ev.symbol, side: ev.side || 'BUY' });
          }
        },
      });
      if (!handle) {
        console.error('[CallbacksPage] mount thất bại');
        return;
      }
      unsub = () => handle.unmount();
    });

    return () => unsub?.();
  }, []);

  const apiBase = API_BASE || 'https://api.tenmien-doitac.vn';

  return (
    <PageScaffold
      title="Callbacks — bắt sự kiện widget"
      intro={
        <>
          Widget KHÔNG xử lý đặt lệnh. Khi user bấm CTA, SDK bắn{' '}
          <code>PartnerActionEvent</code> vào <code>onPartnerAction</code> — site đối tác
          mở form/lựơng điều hướng riêng. Demo bên dưới mở form mẫu.
        </>
      }
    >
      <div className="callbacks-layout">
        <div className="widget-card">
          <div className="widget-card-title">Widget (comp-signals, internalOverlays:false)</div>
          <div id="af-callback-widget" className="widget-host" style={{ height: 360 }} />
        </div>

        <div className="callback-side">
          <div className="widget-card">
            <div className="widget-card-title">Event mới nhất</div>
            <pre className="action-log" style={{ height: 160 }}>
              {lastEvent ? JSON.stringify(lastEvent, null, 2) : 'Chưa có sự kiện — click mã trong widget.'}
            </pre>
          </div>

          {orderForm ? (
            <div className="widget-card order-form">
              <div className="widget-card-title">Form đặt lệnh mẫu (của site đối tác)</div>
              <div className="order-row">
                <span>Mã</span>
                <strong>{orderForm.symbol}</strong>
              </div>
              <div className="order-row">
                <span>Phía</span>
                <strong className={orderForm.side === 'BUY' ? 'buy' : 'sell'}>{orderForm.side}</strong>
              </div>
              <div className="order-row">
                <span>Giá</span>
                <input placeholder="Giá đặt" />
              </div>
              <div className="order-row">
                <span>Khối lượng</span>
                <input placeholder="100" />
              </div>
              <button className="btn">Gửi lệnh (demo)</button>
              <p className="muted">
                Đây là form DEMO — thay bằng API đặt lệnh của chính đối tác.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <CodeBlock
        lang="javascript"
        code={`window.AutofinEmbed.mount({
  el: '#af-widget',
  productId: 'comp-signals',
  locale: 'vi',
  partnerCode: '${PARTNER_CODE}',
  dataProviderId: 'AUTOFIN',
  apiBase: '${apiBase}',
  // tắt popup nội bộ → mọi sự kiện đi qua callback
  features: { internalOverlays: false },

  onPartnerAction: function (event) {
    // event.type: 'stock.detail_open' | 'stock.order_cta' | 'signal.order_cta' | ...
    if (event.type === 'stock.order_cta' || event.type === 'signal.order_cta') {
      openYourOrderForm({
        symbol: event.symbol,
        side: event.side,        // 'BUY' | 'SELL'
        price: event.price,
        signalId: event.signalId,
      });
    }

    if (event.type === 'stock.detail_open') {
      // khi internalOverlays:false — tự điều hướng trang chi tiết
      window.location.href = '/chi-tiet/' + event.symbol;
    }
  },
});`}
      />
    </PageScaffold>
  );
}
