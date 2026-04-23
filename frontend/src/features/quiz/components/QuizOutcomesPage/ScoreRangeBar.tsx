import type { QuizOutcome } from '../../services/quiz.api.ts';

function hasGap(outcomes: QuizOutcome[]) {
  const covered = new Set<number>();
  outcomes.forEach((outcome) => { for (let i = outcome.score_min; i <= outcome.score_max; i += 1) covered.add(i); });
  return Array.from({ length: 101 }, (_, i) => i).some((score) => !covered.has(score));
}

export function ScoreRangeBar({ outcomes }: { outcomes: QuizOutcome[] }) {
  const sorted = [...outcomes].sort((a, b) => a.score_min - b.score_min);
  const overlap = sorted.some((outcome, index) => index > 0 && outcome.score_min <= sorted[index - 1].score_max);
  return (
    <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4">
      <div className="flex h-5 overflow-hidden rounded-full bg-[var(--bg-active)]">
        {sorted.map((outcome) => <div key={outcome.outcome_key} title={outcome.title} style={{ width: `${Math.max(1, outcome.score_max - outcome.score_min + 1)}%`, background: outcome.background_color ?? '#22d3ee' }} />)}
      </div>
      {(hasGap(outcomes) || overlap) && <p className="mt-3 text-xs font-medium text-[var(--color-warning)]">Atenção: há {hasGap(outcomes) ? 'gaps' : 'sobreposição'} nos ranges.</p>}
    </div>
  );
}
