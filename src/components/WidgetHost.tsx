import type { UseAutofinEmbedOptions } from '../lib/embed';
import { useAutofinEmbed } from '../lib/embed';

type WidgetHostProps = Omit<UseAutofinEmbedOptions, 'containerRef'> & {
  height?: number;
  title?: string;
};

/**
 * Khối chứa widget: div host + mount SDK qua useAutofinEmbed.
 * Tương đương HTML thuần: <div id="af-widget-..."/> + window.AutofinEmbed.mount().
 */
export default function WidgetHost({ height = 450, title, ...mountOpts }: WidgetHostProps) {
  const { containerRef, status, error } = useAutofinEmbed(mountOpts);

  return (
    <div className="widget-card">
      {title ? <div className="widget-card-title">{title}</div> : null}
      <div ref={containerRef} className="widget-host" style={{ height }} />
      {status === 'loading' ? <div className="widget-status">Đang nạp SDK…</div> : null}
      {status === 'error' ? <div className="widget-status err">Lỗi: {error}</div> : null}
    </div>
  );
}
