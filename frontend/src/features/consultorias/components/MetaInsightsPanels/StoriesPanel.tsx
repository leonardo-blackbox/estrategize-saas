import type { MediaWithInsights } from '../../../../api/meta.ts';

interface Props {
  media: MediaWithInsights[];
}

const fmt = (n: number) => Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n);

export function StoriesPanel({ media }: Props) {
  const stories = media.filter((m) => m.media_product_type === 'STORY');

  if (stories.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Stories</h3>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
          Nenhuma Story ativa ou capturada recentemente. O snapshot a cada 6h captura métricas antes do expiry de 24h.
        </p>
      </div>
    );
  }

  const totalViews = stories.reduce((s, m) => s + (m.metrics.views ?? 0), 0);
  const totalReach = stories.reduce((s, m) => s + (m.metrics.reach ?? 0), 0);
  const avgReplies = stories.length > 0 ? Math.round(stories.reduce((s, m) => s + (m.metrics.replies ?? 0), 0) / stories.length) : 0;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Stories</h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[var(--bg-base)] rounded p-3 text-center">
          <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(totalViews)}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">views</p>
        </div>
        <div className="bg-[var(--bg-base)] rounded p-3 text-center">
          <p className="text-lg font-bold text-[var(--text-primary)]">{fmt(totalReach)}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">reach</p>
        </div>
        <div className="bg-[var(--bg-base)] rounded p-3 text-center">
          <p className="text-lg font-bold text-[var(--text-primary)]">{avgReplies}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">replies/story</p>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {stories.slice(0, 6).map((s) => (
          <a key={s.id} href={s.permalink} target="_blank" rel="noreferrer" className="aspect-[9/16] rounded bg-[var(--bg-base)] overflow-hidden relative group">
            {s.thumbnail_url ? (
              <img src={s.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : null}
            <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/60 px-1 rounded">
              {fmt(s.metrics.views ?? 0)}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
