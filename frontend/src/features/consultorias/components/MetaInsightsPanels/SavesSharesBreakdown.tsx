import type { MediaWithInsights } from '../../../../api/meta.ts';

interface Props {
  media: MediaWithInsights[];
}

const fmt = (n: number) => Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n);

function MediaRow({ item, metric }: { item: MediaWithInsights; metric: 'saved' | 'shares' }) {
  const value = item.metrics[metric] ?? 0;
  return (
    <a
      href={item.permalink}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 py-1.5 hover:bg-[var(--bg-surface-2)] transition rounded px-2 -mx-2"
    >
      {item.thumbnail_url ? (
        <img src={item.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover bg-[var(--bg-base)]" loading="lazy" />
      ) : (
        <div className="w-10 h-10 rounded bg-[var(--bg-base)] flex items-center justify-center text-[10px] text-[var(--text-tertiary)]">
          {item.media_product_type[0]}
        </div>
      )}
      <span className="flex-1 text-[12px] text-[var(--text-secondary)] truncate">
        {item.caption?.slice(0, 60) || item.media_product_type.toLowerCase()}
      </span>
      <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">{fmt(value)}</span>
    </a>
  );
}

export function SavesSharesBreakdown({ media }: Props) {
  const topSaves = [...media].sort((a, b) => (b.metrics.saved ?? 0) - (a.metrics.saved ?? 0)).slice(0, 5);
  const topShares = [...media].sort((a, b) => (b.metrics.shares ?? 0) - (a.metrics.shares ?? 0)).slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">Top Saves</h3>
        <p className="text-[11px] text-[var(--text-tertiary)] mb-3">Alto valor percebido — conteúdo para replicar.</p>
        <div className="space-y-1">
          {topSaves.map((m) => <MediaRow key={`save-${m.id}`} item={m} metric="saved" />)}
        </div>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">Top Shares</h3>
        <p className="text-[11px] text-[var(--text-tertiary)] mb-3">Alta viralidade — formatos a explorar.</p>
        <div className="space-y-1">
          {topShares.map((m) => <MediaRow key={`share-${m.id}`} item={m} metric="shares" />)}
        </div>
      </div>
    </div>
  );
}
