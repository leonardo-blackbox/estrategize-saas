import type { AudienceResponse } from '../../../../api/meta.ts';

interface Props {
  data: AudienceResponse;
}

interface Gap {
  bucket: string;
  follower: number;
  engaged: number;
  diff: number;
}

function findGaps(data: AudienceResponse): Gap[] {
  if (!data.follower || !data.engaged) return [];
  const gaps: Gap[] = [];
  const buckets = new Set([
    ...Object.keys(data.follower.age_gender),
    ...Object.keys(data.engaged.age_gender),
  ]);
  for (const b of buckets) {
    const f = data.follower.age_gender[b] ?? 0;
    const e = data.engaged.age_gender[b] ?? 0;
    const diff = e - f;
    if (Math.abs(diff) > 0.05) {
      gaps.push({ bucket: b, follower: f, engaged: e, diff });
    }
  }
  return gaps.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 4);
}

export function EngagedVsFollowersGap({ data }: Props) {
  const gaps = findGaps(data);
  if (gaps.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">ICP real vs ICP percebido</h3>
      <p className="text-[11px] text-[var(--text-tertiary)] mb-4">
        Onde a audiência que engaja diverge da audiência que segue. Sinais &gt; 5 pontos percentuais.
      </p>
      <div className="space-y-2">
        {gaps.map((g) => {
          const [gender, age] = g.bucket.split('.');
          const isPositive = g.diff > 0;
          return (
            <div key={g.bucket} className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-[var(--text-secondary)]">
                {gender === 'F' ? '♀' : '♂'} {age}
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[var(--text-tertiary)]">seguem {(g.follower * 100).toFixed(0)}%</span>
                <span className="text-[var(--text-tertiary)]">·</span>
                <span className="text-[var(--text-tertiary)]">engajam {(g.engaged * 100).toFixed(0)}%</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-semibold ${
                    isPositive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                  }`}
                >
                  {isPositive ? '+' : ''}{(g.diff * 100).toFixed(1)}pp
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
