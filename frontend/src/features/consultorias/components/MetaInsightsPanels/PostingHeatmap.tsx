import type { MediaWithInsights } from '../../../../api/meta.ts';

interface Props {
  media: MediaWithInsights[];
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOUR_BUCKETS = [0, 3, 6, 9, 12, 15, 18, 21];

function buildGrid(media: MediaWithInsights[]) {
  const grid: Array<Array<{ count: number; totalReach: number }>> = Array.from({ length: 7 }, () =>
    HOUR_BUCKETS.map(() => ({ count: 0, totalReach: 0 })),
  );
  for (const m of media) {
    if (!m.timestamp) continue;
    const d = new Date(m.timestamp);
    const day = d.getDay();
    const hour = d.getHours();
    const bucketIdx = HOUR_BUCKETS.findIndex((h, i) => hour >= h && (i === HOUR_BUCKETS.length - 1 || hour < (HOUR_BUCKETS[i + 1] ?? 24)));
    if (bucketIdx >= 0) {
      const cell = grid[day]?.[bucketIdx];
      if (cell) {
        cell.count++;
        cell.totalReach += m.metrics.reach ?? 0;
      }
    }
  }
  return grid;
}

function colorFor(intensity: number): string {
  // intensity ∈ [0, 1]
  if (intensity === 0) return 'var(--bg-base)';
  const alpha = 0.15 + intensity * 0.7;
  return `rgba(99, 102, 241, ${alpha})`; // indigo
}

export function PostingHeatmap({ media }: Props) {
  if (media.length < 5) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Melhor horário para postar</h3>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
          Precisa de pelo menos 14 dias de posts para calcular o melhor horário.
        </p>
      </div>
    );
  }

  const grid = buildGrid(media);
  const allReach = grid.flat().map((c) => (c.count > 0 ? c.totalReach / c.count : 0));
  const maxReach = Math.max(...allReach, 1);

  // Find best slot
  let bestDay = 0;
  let bestHour = 0;
  let bestAvg = 0;
  grid.forEach((row, di) =>
    row.forEach((cell, hi) => {
      if (cell.count === 0) return;
      const avg = cell.totalReach / cell.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDay = di;
        bestHour = HOUR_BUCKETS[hi] ?? 0;
      }
    }),
  );

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Melhor horário para postar</h3>
        {bestAvg > 0 && (
          <span className="text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
            {DAYS[bestDay]} {bestHour}h
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-px" style={{ gridTemplateColumns: `auto repeat(${HOUR_BUCKETS.length}, 28px)` }}>
          <div />
          {HOUR_BUCKETS.map((h) => (
            <div key={h} className="text-[9px] text-[var(--text-tertiary)] text-center">{h}h</div>
          ))}
          {DAYS.map((day, di) => (
            <>
              <div key={`label-${di}`} className="text-[10px] text-[var(--text-tertiary)] pr-2 text-right self-center">{day}</div>
              {grid[di]?.map((cell, hi) => {
                const avg = cell.count > 0 ? cell.totalReach / cell.count : 0;
                const intensity = avg / maxReach;
                return (
                  <div
                    key={`${di}-${hi}`}
                    className="h-6 rounded-sm"
                    style={{ background: colorFor(intensity) }}
                    title={cell.count > 0 ? `${cell.count} posts · reach médio ${Math.round(avg)}` : 'sem posts'}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
