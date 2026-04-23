import type { EditorField } from '../types.ts';

function choices(options: unknown) { return ((options as { choices?: Array<{ label: string; imageUrl?: string }> })?.choices ?? []); }
function items(options: unknown) { return ((options as { items?: Array<{ label: string }> })?.items ?? []); }

export function QuizLivePreview({ field }: { field?: EditorField }) {
  if (!field) return <section className="rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-8 text-[var(--text-tertiary)]">Selecione um campo</section>;
  const options = field.options as Record<string, unknown>;
  return (
    <section className="min-h-[560px] rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-8 shadow-[var(--shadow-soft)]">
      <p className="mb-3 text-xs uppercase tracking-[.24em] text-[var(--accent)]">Preview</p>
      <h2 className="mb-8 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{field.title}</h2>
      {field.type === 'image_choice' && <div className="grid grid-cols-2 gap-3">{choices(options).map((choice, index) => <div key={index} className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-3"><div className="mb-3 h-24 rounded-2xl bg-[var(--bg-active)]" style={{ backgroundImage: choice.imageUrl ? `url(${choice.imageUrl})` : undefined }} /><span className="text-sm text-[var(--text-primary)]">{choice.label}</span></div>)}</div>}
      {field.type === 'rating' && <div className="flex gap-2 text-3xl">{Array.from({ length: Number(options.max ?? 5) }, (_, index) => <span key={index}>★</span>)}</div>}
      {field.type === 'opinion_scale' && <div><div className="flex flex-wrap gap-2">{Array.from({ length: Number(options.max ?? 10) - Number(options.min ?? 0) + 1 }, (_, i) => <button key={i} className="h-11 w-11 rounded-xl bg-[var(--bg-hover)] text-[var(--text-primary)]">{Number(options.min ?? 0) + i}</button>)}</div><div className="mt-3 flex justify-between text-xs text-[var(--text-tertiary)]"><span>{String(options.labelMin ?? '')}</span><span>{String(options.labelMax ?? '')}</span></div></div>}
      {field.type === 'yes_no' && <div className="grid gap-3 sm:grid-cols-2"><button className="rounded-3xl bg-[rgba(48,209,88,0.12)] p-6 text-[var(--text-primary)]">{String(options.yesIcon ?? '👍')} {String(options.yesLabel ?? 'Sim')}</button><button className="rounded-3xl bg-[rgba(255,59,48,0.12)] p-6 text-[var(--text-primary)]">{String(options.noIcon ?? '👎')} {String(options.noLabel ?? 'Não')}</button></div>}
      {field.type === 'ranking' && <ol className="space-y-3">{items(options).map((item, index) => <li key={index} className="rounded-2xl bg-[var(--bg-hover)] p-4 text-[var(--text-primary)]">☰ {index + 1}. {item.label}</li>)}</ol>}
      {field.type === 'slider' && <div><input type="range" className="w-full" min={Number(options.min ?? 0)} max={Number(options.max ?? 100)} readOnly /><div className="mt-2 flex justify-between text-sm text-[var(--text-secondary)]"><span>{String(options.min ?? 0)}</span><span>{String(options.max ?? 100)}{String(options.unit ?? '')}</span></div></div>}
      {!['image_choice', 'rating', 'opinion_scale', 'yes_no', 'ranking', 'slider'].includes(field.type) && <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] p-4 text-[var(--text-secondary)]">Campo {field.type}</div>}
    </section>
  );
}
