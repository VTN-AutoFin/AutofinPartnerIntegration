import { useEffect, useState } from 'react';
import type { PartnerActionEvent } from '../lib/embed';
import { loadEmbedSdk } from '../lib/embed';

const MAX_LINES = 50;

/**
 * Log toàn cục sự kiện partnerAction (sub qua AutofinEmbed.on — late bind,
 * nhận cả event từ widget mount riêng lẻ).
 */
export default function ActionLog({ height = 200 }: { height?: number }) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mounted = true;

    loadEmbedSdk()
      .then((sdk) => {
        if (!mounted) return;
        unsub = sdk.on('partnerAction', (ev: PartnerActionEvent) => {
          setLines((prev) =>
            [
              `${new Date(ev.ts).toLocaleTimeString()}  ${ev.type}  ${ev.symbol}` +
                (ev.side ? ` ${ev.side}` : '') +
                (ev.price != null ? ` @${ev.price}` : ''),
              ...prev,
            ].slice(0, MAX_LINES)
          );
        });
        setLines((prev) => ['(đã sub partnerAction — click widget để xem event)', ...prev].slice(0, MAX_LINES));
      })
      .catch((e: Error) => {
        if (mounted) setLines([`Lỗi nạp SDK: ${e.message}`]);
      });

    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  return (
    <div className="widget-card">
      <div className="widget-card-title">partnerAction events</div>
      <pre className="action-log" style={{ height }}>
        {lines.length ? lines.join('\n') : '…'}
      </pre>
    </div>
  );
}
