import type { AccountInsightsResponse } from '../../../../api/meta.ts';

const fmt = (n: number) => Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n);

interface Props {
  data: AccountInsightsResponse;
}

function deltaPct(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? null : 0;
  return ((curr - prev) / prev) * 100;
}

function DeltaIndicator({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-[11px] text-[var(--text-tertiary)]">novo</span>;
  }
  const isUp = pct >= 0;
  const formatted = `${isUp ? '↑' : '↓'} ${Math.abs(pct).toFixed(0)}%`;
  return (
    <span className={`text-[11px] font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>{formatted}</span>
  );
}

function MetricCard({ label, value, prev, sub }: { label: string; value: number; prev: number; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</p>
        <DeltaIndicator pct={deltaPct(value, prev)} />
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{fmt(value)}</p>
      {sub && <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}

export function HeroMetricsOfficial({ data }: Props) {
  const { current: c, previous: p } = data;
  const followsNet = c.follows - c.unfollows;
  const prevFollowsNet = p.follows - p.unfollows;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard label="Reach 28d" value={c.reach} prev={p.reach} sub="contas únicas alcançadas" />
      <MetricCard label="Accounts Engaged" value={c.accounts_engaged} prev={p.accounts_engaged} sub="contas que interagiram" />
      <MetricCard label="Profile Views" value={c.profile_views} prev={p.profile_views} sub="visitas ao perfil" />
      <MetricCard label="Follows líquidos" value={followsNet} prev={prevFollowsNet} sub={`+${fmt(c.follows)} / -${fmt(c.unfollows)}`} />
    </div>
  );
}
