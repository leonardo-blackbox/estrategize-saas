import type { QuizOutcome } from '../../services/quiz.api.ts';

const metaEvents = ['Lead', 'Contact', 'Schedule', 'ViewContent', 'Purchase', 'Custom'];
interface OutcomeEditorPanelProps { outcome?: QuizOutcome; onChange: (updates: Partial<QuizOutcome>) => void; saveStatus: string; }

export function OutcomeEditorPanel({ outcome, onChange, saveStatus }: OutcomeEditorPanelProps) {
  if (!outcome) return <aside className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 text-[var(--text-tertiary)]">Selecione um resultado.</aside>;
  const metaOn = Boolean(outcome.pixel_event_name);
  const selectedMeta = metaEvents.includes(outcome.pixel_event_name ?? '') ? outcome.pixel_event_name : 'Custom';
  return (
    <aside className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5 text-[var(--text-primary)]">
      <div className="mb-4 flex justify-between text-xs uppercase tracking-[.2em] text-[var(--accent)]"><span>Editor</span><span>{saveStatus}</span></div>
      <input value={outcome.title} onChange={(event) => onChange({ title: event.target.value })} className="mb-3 w-full rounded-2xl bg-[var(--bg-hover)] px-3 py-2 text-[var(--text-primary)]" />
      <textarea value={outcome.description ?? ''} onChange={(event) => onChange({ description: event.target.value })} className="mb-3 min-h-24 w-full rounded-2xl bg-[var(--bg-hover)] px-3 py-2 text-[var(--text-primary)]" placeholder="Descrição" />
      <div className="mb-3 grid grid-cols-2 gap-2"><input type="number" value={outcome.score_min} onChange={(event) => onChange({ score_min: Number(event.target.value) })} className="rounded-2xl bg-[var(--bg-hover)] px-3 py-2" /><input type="number" value={outcome.score_max} onChange={(event) => onChange({ score_max: Number(event.target.value) })} className="rounded-2xl bg-[var(--bg-hover)] px-3 py-2" /></div>
      <input type="color" value={outcome.background_color ?? '#22d3ee'} onChange={(event) => onChange({ background_color: event.target.value })} className="mb-3 h-11 w-full rounded-2xl bg-[var(--bg-hover)]" />
      <input value={outcome.image_url ?? ''} onChange={(event) => onChange({ image_url: event.target.value })} className="mb-3 w-full rounded-2xl bg-[var(--bg-hover)] px-3 py-2" placeholder="URL de imagem" />
      <select value={outcome.cta_type} onChange={(event) => onChange({ cta_type: event.target.value as QuizOutcome['cta_type'] })} className="mb-3 w-full rounded-2xl bg-[var(--bg-surface-2)] px-3 py-2"><option value="none">Nenhum</option><option value="url">URL redirect</option><option value="whatsapp">WhatsApp</option></select>
      {outcome.cta_type !== 'none' && <input value={outcome.cta_url ?? ''} onChange={(event) => onChange({ cta_url: event.target.value })} className="mb-3 w-full rounded-2xl bg-[var(--bg-hover)] px-3 py-2" placeholder="URL ou número" />}
      <input value={outcome.cta_label ?? ''} onChange={(event) => onChange({ cta_label: event.target.value })} className="mb-4 w-full rounded-2xl bg-[var(--bg-hover)] px-3 py-2" placeholder="Label do CTA" />
      <div className="rounded-2xl border border-[var(--accent-subtle)] bg-[var(--accent-muted)] p-4"><label className="flex gap-2 text-sm"><input type="checkbox" checked={metaOn} onChange={(event) => onChange({ pixel_event_name: event.target.checked ? 'Contact' : null })} />📡 Evento Meta adicional</label>{metaOn && <div className="mt-3 grid gap-2"><select value={selectedMeta ?? 'Contact'} onChange={(event) => onChange({ pixel_event_name: event.target.value === 'Custom' ? 'CustomEvent' : event.target.value })} className="rounded-xl bg-[var(--bg-surface-2)] px-3 py-2">{metaEvents.map((event) => <option key={event}>{event}</option>)}</select>{selectedMeta === 'Custom' && <input value={outcome.pixel_event_name ?? ''} onChange={(event) => onChange({ pixel_event_name: event.target.value })} className="rounded-xl bg-[var(--bg-hover)] px-3 py-2" />}</div>}<p className="mt-2 text-xs text-[var(--text-tertiary)]">Disparado quando o respondente vê este resultado, além do SubmitApplication.</p></div>
    </aside>
  );
}
