import type { QuizOutcome } from '../../services/quiz.api.ts';

interface OutcomeCardProps { outcome: QuizOutcome; active: boolean; onEdit: () => void; onDelete: () => void; }

export function OutcomeCard({ outcome, active, onEdit, onDelete }: OutcomeCardProps) {
  return (
    <article className={`rounded-3xl border p-4 ${active ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border-hairline)] bg-[var(--bg-surface-1)]'}`}>
      <div className="mb-3 h-2 rounded-full" style={{ background: outcome.background_color ?? '#22d3ee' }} />
      <h3 className="font-semibold text-[var(--text-primary)]">{outcome.title}</h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{outcome.score_min}% – {outcome.score_max}%</p>
      <span className="mt-3 inline-flex rounded-full bg-[var(--bg-hover)] px-3 py-1 text-xs text-[var(--text-primary)]">CTA: {outcome.cta_type}</span>
      <div className="mt-4 flex gap-2"><button onClick={onEdit} className="rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-text)]">Editar</button><button onClick={onDelete} className="rounded-full bg-[rgba(255,59,48,0.12)] px-3 py-2 text-xs text-[var(--color-error)]">Excluir</button></div>
    </article>
  );
}
