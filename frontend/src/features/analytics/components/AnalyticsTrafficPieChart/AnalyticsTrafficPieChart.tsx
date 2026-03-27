import type { AnalyticsData } from '../../services/analytics.api';
import type { UTMMode } from '../../types';

interface AnalyticsTrafficPieChartProps {
  traffic_split: AnalyticsData['traffic_split'];
  mode: UTMMode;
  totalViews: number;
}

export function AnalyticsTrafficPieChart({ traffic_split, mode, totalViews }: AnalyticsTrafficPieChartProps) {
  const { paid, organic, total } = traffic_split;
  if (total === 0 || paid === 0) return null;

  const dispPaid    = mode === 'leads' ? paid    : Math.round((paid / total) * totalViews);
  const dispOrganic = mode === 'leads' ? organic : totalViews - Math.round((paid / total) * totalViews);
  const dispTotal   = mode === 'leads' ? total   : totalViews;
  const paidPct     = dispTotal > 0 ? dispPaid / dispTotal : 0;
  const orgPct      = 1 - paidPct;
  const R = 52; const cx = 70; const cy = 70;
  const circ = 2 * Math.PI * R;
  const unit = mode === 'leads' ? (dispTotal !== 1 ? 'leads' : 'lead') : 'views';

  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-0.5">Origem do tráfego</h3>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            {mode === 'leads' ? 'Com base nos leads convertidos no período' : 'Estimativa proporcional com base nos leads × total de views'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8 flex-wrap">
        <svg width={140} height={140} viewBox="0 0 140 140">
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(124,92,252,0.2)" strokeWidth={18} />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#7c5cfc" strokeWidth={18}
            strokeDasharray={`${paidPct * circ} ${circ - paidPct * circ}`}
            strokeDashoffset={circ / 4} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(124,92,252,0.35)" strokeWidth={18}
            strokeDasharray={`${orgPct * circ} ${circ - orgPct * circ}`}
            strokeDashoffset={circ / 4 - paidPct * circ} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--text-primary)">{Math.round(paidPct * 100)}%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">pago</text>
        </svg>

        <div className="flex flex-col gap-4 flex-1">
          {[
            { label: 'Tráfego pago', val: dispPaid, pct: paidPct, color: '#7c5cfc' },
            { label: 'Orgânico / Direto', val: dispOrganic, pct: orgPct, color: 'rgba(124,92,252,0.4)' },
          ].map(({ label, val, pct, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--text-primary)] font-medium">{label}</span>
                  <span className="text-[13px] font-bold text-[var(--text-primary)]">{val}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full" style={{ background: 'var(--border-hairline)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: color, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-[var(--text-tertiary)] pt-1" style={{ borderTop: '1px solid var(--border-hairline)' }}>{dispTotal} {unit} no período</p>
        </div>
      </div>
    </div>
  );
}
