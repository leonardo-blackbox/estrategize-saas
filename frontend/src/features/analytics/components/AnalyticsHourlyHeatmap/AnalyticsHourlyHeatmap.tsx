import { useState, useMemo } from 'react';
import type { AnalyticsData } from '../../services/analytics.api';

type HourData = AnalyticsData['hourly'][number];

function FixedTooltip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', left: x, top: y - 10, transform: 'translate(-50%, -100%)', zIndex: 9999, pointerEvents: 'none', background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)', borderRadius: 10, padding: '8px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 130 }}>
      {children}
    </div>
  );
}

interface AnalyticsHourlyHeatmapProps {
  hourly: HourData[];
}

export function AnalyticsHourlyHeatmap({ hourly }: AnalyticsHourlyHeatmapProps) {
  const maxViews = useMemo(() => Math.max(...hourly.map(h => h.views), 1), [hourly]);
  const [tooltip, setTooltip] = useState<{ hour: number; x: number; y: number } | null>(null);

  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-0.5">Picos por horário (UTC)</h3>
      <p className="text-[11px] text-[var(--text-tertiary)] mb-4">Distribuição de visualizações nas 24h</p>

      <div className="overflow-x-auto">
        <div className="flex items-end gap-[3px]" style={{ minHeight: 60, minWidth: 24 * 22 }}>
          {hourly.map((h) => {
            const pct = (h.views / maxViews) * 100;
            const barColor = pct > 60 ? '#ff6b6b' : pct > 30 ? '#ffb347' : '#7c5cfc';
            return (
              <div key={h.hour} className="flex-1 flex flex-col items-center cursor-default" style={{ minWidth: 18 }}
                onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ hour: h.hour, x: r.left + r.width / 2, y: r.top }); }}
                onMouseLeave={() => setTooltip(null)}>
                <div className="w-full rounded-t-sm transition-all duration-300" style={{ height: Math.max(3, (h.views / maxViews) * 52), background: tooltip?.hour === h.hour ? '#a07cfe' : barColor, opacity: h.views === 0 ? 0.15 : 0.85 }} />
                <span className="text-[8px] text-[var(--text-tertiary)] mt-1">{String(h.hour).padStart(2, '0')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {tooltip && (() => {
        const h = hourly.find(x => x.hour === tooltip.hour);
        if (!h) return null;
        return (
          <FixedTooltip x={tooltip.x} y={tooltip.y}>
            <p className="text-[11px] font-semibold text-[var(--text-primary)] mb-1">{String(h.hour).padStart(2, '0')}:00 – {String(h.hour + 1).padStart(2, '0')}:00</p>
            <p className="text-[11px] text-[var(--text-secondary)]">{h.views} views · {h.starts} inícios · {h.submits} envios</p>
          </FixedTooltip>
        );
      })()}
    </div>
  );
}
