import type { ReactNode } from 'react';
import type { UseAutofinEmbedOptions } from '../lib/embed';
import { useAutofinEmbed } from '../lib/embed';
import { featuresLine, mountSnippet } from '../lib/snippet';
import { widgetInfo } from '../lib/widgets';
import WidgetHeader from './WidgetHeader';

type WidgetHostProps = Omit<UseAutofinEmbedOptions, 'containerRef'> & {
  height?: number;
  /** Ghi đè tên / mô tả mặc định lấy từ lib/widgets. */
  name?: string;
  description?: ReactNode;
};

/**
 * Khối chứa widget: header (tên, mô tả, nút xem mã nhúng) + div host + mount
 * SDK qua useAutofinEmbed.
 * Tương đương HTML thuần: <div id="af-widget-..."/> + window.AutofinEmbed.mount().
 */
export default function WidgetHost({ height = 450, name, description, ...mountOpts }: WidgetHostProps) {
  const { containerRef, status, error } = useAutofinEmbed(mountOpts);
  const info = widgetInfo(mountOpts.productId);
  const { symbol, features } = mountOpts;

  return (
    <div className="widget-card">
      <WidgetHeader
        name={name ?? info.name}
        id={mountOpts.productId}
        description={description ?? info.description}
        tags={symbol ? [`symbol: ${symbol}`] : []}
        code={mountSnippet(mountOpts.productId, featuresLine(features), { symbol, height })}
      />
      <div ref={containerRef} className="widget-host" style={{ height }} />
      {status === 'loading' ? <div className="widget-status">Đang nạp SDK…</div> : null}
      {status === 'error' ? <div className="widget-status err">Lỗi: {error}</div> : null}
    </div>
  );
}
