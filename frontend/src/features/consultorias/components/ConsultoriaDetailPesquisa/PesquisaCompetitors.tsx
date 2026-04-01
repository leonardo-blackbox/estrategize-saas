import type { CompetitorData } from '../../../../types/market-intelligence.ts';

interface Props {
  competitors: CompetitorData[];
}

export function PesquisaCompetitors({ competitors }: Props) {
  if (!competitors.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
        Concorrentes Descobertos ({competitors.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {competitors.map((c, i) => (
          <div key={i} className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">{c.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-tertiary)]">
                {c.source === 'google_maps' ? '🗺 Maps' : '📱 IG'}
              </span>
            </div>
            {c.address && <p className="text-xs text-[var(--text-secondary)]">{c.address}</p>}
            {c.rating !== null && (
              <p className="text-xs text-[var(--text-secondary)]">
                ⭐ {c.rating} ({c.reviewsCount ?? 0} avaliações)
              </p>
            )}
            {c.instagramHandle && (
              <p className="text-xs text-[var(--text-secondary)]">📱 @{c.instagramHandle}</p>
            )}
            {c.website && (
              <a href={c.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[var(--accent)] hover:underline truncate block">
                {c.website}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
