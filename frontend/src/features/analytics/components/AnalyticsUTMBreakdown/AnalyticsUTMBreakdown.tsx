import type { AnalyticsData } from '../../services/analytics.api';
import type { UTMMode } from '../../types';

const PAID_SOURCES = /facebook|instagram|google|tiktok|youtube|twitter|linkedin|meta|ads/i;

interface AnalyticsUTMBreakdownProps {
  utm_breakdown: AnalyticsData['utm_breakdown'];
  mode: UTMMode;
  totalViews: number;
}

export function AnalyticsUTMBreakdown({ utm_breakdown, mode, totalViews }: AnalyticsUTMBreakdownProps) {
  if (utm_breakdown.length === 0) return null;

  const totalLeads = utm_breakdown.reduce((s, x) => s + x.count, 0);
  const rows = utm_breakdown.map(({ source, count }) => ({
    source, count,
    display: mode === 'leads' ? count : Math.round((count / totalLeads) * totalViews),
  }));
  const maxDisplay = Math.max(...rows.map(r => r.display), 1);
  const dispTotal  = mode === 'leads' ? totalLeads : totalViews;

  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-0.5">UTM Source — {mode === 'leads' ? 'leads' : 'views'} por origem</h3>
        <p className="text-[11px] text-[var(--text-tertiary)]">
          {mode === 'leads' ? 'Baseado nos leads convertidos (utm_source da URL)' : 'Estimativa de views por origem (proporcional à distribuição de leads)'}
        </p>
      </div>

      <div className="space-y-3">
        {rows.map(({ source, display }) => {
          const pct      = (display / maxDisplay) * 100;
          const sharePct = dispTotal > 0 ? Math.round((display / dispTotal) * 100) : 0;
          const isPaid   = PAID_SOURCES.test(source) && source !== '(direto / orgânico)';
          const barColor = isPaid ? '#7c5cfc' : 'rgba(124,92,252,0.4)';
          return (
            <div key={source}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {isPaid && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider" style={{ background: 'rgba(124,92,252,0.15)', color: '#7c5cfc' }}>pago</span>}
                  <span className="text-[12px] text-[var(--text-primary)] font-medium">{source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-tertiary)]">{sharePct}%</span>
                  <span className="text-[12px] font-semibold text-[var(--text-primary)] w-7 text-right">{display}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'var(--border-hairline)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
