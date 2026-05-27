import type { MediaWithInsights } from '../../../../api/meta.ts';

interface Props {
  media: MediaWithInsights[];
}

const fmt = (n: number) => Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n);

function fmtWatch(ms?: number): string {
  if (!ms) return '–';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function ReelsRetentionPanel({ media }: Props) {
  const reels = media
    .filter((m) => m.media_product_type === 'REELS')
    .sort((a, b) => (b.metrics.ig_reels_avg_watch_time ?? 0) - (a.metrics.ig_reels_avg_watch_time ?? 0))
    .slice(0, 5);

  if (reels.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Performance dos Reels</h3>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-3">Nenhum Reel encontrado nas últimas 25 mídias.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Performance dos Reels (top 5 retention)</h3>
      <div className="space-y-2">
        {reels.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[24px_1fr_auto] gap-3 items-center text-[12px] py-1.5 border-b border-[var(--border-hairline)] last:border-0">
            <span className="text-[var(--text-tertiary)] font-mono">{i + 1}</span>
            <span className="text-[var(--text-secondary)] truncate">
              {r.caption?.slice(0, 60) || `Reel ${r.id.slice(0, 8)}`}
            </span>
            <span className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
              <span title="Watch time médio">⏱ {fmtWatch(r.metrics.ig_reels_avg_watch_time)}</span>
              <span title="Replays">↻ {fmt(r.metrics.clips_replays_count ?? 0)}</span>
              <span title="Views">▶ {fmt(r.metrics.views ?? 0)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
