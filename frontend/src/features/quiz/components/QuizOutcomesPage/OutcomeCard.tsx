import type { QuizOutcome } from '../../services/quiz.api.ts';

interface OutcomeCardProps { outcome: QuizOutcome; active: boolean; onEdit: () => void; onDelete: () => void; }

export function OutcomeCard({ outcome, active, onEdit, onDelete }: OutcomeCardProps) {
  return (
    <article className={`rounded-3xl border p-4 ${active ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-white/[.04]'}`}>
      <div className="mb-3 h-2 rounded-full" style={{ background: outcome.background_color ?? '#22d3ee' }} />
      <h3 className="font-semibold text-white">{outcome.title}</h3>
      <p className="mt-1 text-sm text-slate-300">{outcome.score_min}% – {outcome.score_max}%</p>
      <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">CTA: {outcome.cta_type}</span>
      <div className="mt-4 flex gap-2"><button onClick={onEdit} className="rounded-full bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950">Editar</button><button onClick={onDelete} className="rounded-full bg-red-500/15 px-3 py-2 text-xs text-red-200">Excluir</button></div>
    </article>
  );
}
