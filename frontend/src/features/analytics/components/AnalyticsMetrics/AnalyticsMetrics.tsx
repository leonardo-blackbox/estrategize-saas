import type { AnalyticsData } from '../../services/analytics.api';

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <p className="text-[11px] font-medium text-[var(--text-tertiary)] mb-2 uppercase tracking-wider">{label}</p>
      <p className="text-[28px] font-bold tracking-tight" style={{ color: color || 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
    </div>
  );
}

// ─── FunnelBar ────────────────────────────────────────────────────────────────

function FunnelBar({ label, value, max, rate, color }: { label: string; value: number; max: number; rate: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-[var(--text-secondary)]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono text-[var(--text-tertiary)]">{value}</span>
          <span className="text-[12px] font-semibold" style={{ color }}>{rate}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'var(--border-hairline)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── AnalyticsMetrics ─────────────────────────────────────────────────────────

interface AnalyticsMetricsProps {
  data: Pick<AnalyticsData, 'views' | 'starts' | 'submits' | 'total_responses' | 'start_rate' | 'completion_rate' | 'overall_rate'>;
}

export function AnalyticsMetrics({ data }: AnalyticsMetricsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Visualizações" value={data.views} />
        <MetricCard label="Inícios" value={data.starts} />
        <MetricCard label="Envios" value={data.submits} />
        <MetricCard label="Total respostas" value={data.total_responses} color="#7c5cfc" />
      </div>

      <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4">Funil de conversão</h3>
        <div className="space-y-4">
          <FunnelBar label="Visualizações → Inícios" value={data.starts} max={data.views} rate={data.start_rate} color="#7c5cfc" />
          <FunnelBar label="Inícios → Envios" value={data.submits} max={data.starts} rate={data.completion_rate} color="#3b82f6" />
          <FunnelBar label="Visualizações → Envios (geral)" value={data.submits} max={data.views} rate={data.overall_rate} color="#30d158" />
        </div>
      </div>
    </>
  );
}
