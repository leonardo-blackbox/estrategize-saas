import { useState, useMemo } from 'react';
import { fmtDate } from '../../utils/analytics-dates';
import type { AnalyticsData } from '../../services/analytics.api';

type DayData = AnalyticsData['timeline'][number];

// ─── FixedTooltip ─────────────────────────────────────────────────────────────

function FixedTooltip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', left: x, top: y - 10, transform: 'translate(-50%, -100%)', zIndex: 9999, pointerEvents: 'none', background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)', borderRadius: 10, padding: '8px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 130 }}>
      {children}
    </div>
  );
}

// ─── AnalyticsDailyChart ──────────────────────────────────────────────────────

interface AnalyticsDailyChartProps {
  timeline: DayData[];
}

export function AnalyticsDailyChart({ timeline }: AnalyticsDailyChartProps) {
  const maxVal = useMemo(() => Math.max(...timeline.map(d => d.views), 1), [timeline]);
  const [tooltip, setTooltip] = useState<{ date: string; x: number; y: number } | null>(null);

  if (timeline.length === 0) return null;
  const visible = timeline.length > 60 ? timeline.slice(-60) : timeline;

  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Eventos por dia</h3>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#7c5cfc' }} />views</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#3b82f6' }} />inícios</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#30d158' }} />envios</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex items-end gap-[2px] pb-1" style={{ minHeight: 80, minWidth: visible.length * 18 }}>
          {visible.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center cursor-default" style={{ minWidth: 14 }}
              onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ date: day.date, x: r.left + r.width / 2, y: r.top }); }}
              onMouseLeave={() => setTooltip(null)}>
              <div className="w-full rounded-t-sm" style={{ height: Math.max(2, (day.views / maxVal) * 72), background: tooltip?.date === day.date ? '#a07cfe' : '#7c5cfc', opacity: 0.9, transition: 'background 0.15s', position: 'relative' }}>
                {day.starts > 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(day.starts / Math.max(day.views, 1)) * 100}%`, background: '#3b82f6', borderRadius: '2px 2px 0 0', opacity: 0.9 }} />}
                {day.submits > 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(day.submits / Math.max(day.views, 1)) * 100}%`, background: '#30d158', borderRadius: '2px 2px 0 0', opacity: 0.9 }} />}
              </div>
            </div>
          ))}
        </div>

        <div className="flex" style={{ minWidth: visible.length * 18 }}>
          {visible.map((day, i) => {
            const step = visible.length <= 14 ? 1 : visible.length <= 30 ? 3 : 7;
            return (
              <div key={day.date} className="flex-1 text-center" style={{ minWidth: 14 }}>
                {i % step === 0 && <span className="text-[9px] text-[var(--text-tertiary)]">{new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'numeric' })}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {tooltip && (() => {
        const day = visible.find(d => d.date === tooltip.date);
        if (!day) return null;
        return (
          <FixedTooltip x={tooltip.x} y={tooltip.y}>
            <p className="text-[11px] font-semibold text-[var(--text-primary)] mb-1">{fmtDate(day.date)}</p>
            <p className="text-[11px]" style={{ color: '#7c5cfc' }}>{day.views} views</p>
            <p className="text-[11px]" style={{ color: '#3b82f6' }}>{day.starts} inícios</p>
            <p className="text-[11px]" style={{ color: '#30d158' }}>{day.submits} envios</p>
          </FixedTooltip>
        );
      })()}
    </div>
  );
}
