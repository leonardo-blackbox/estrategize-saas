import type { EditorField } from '../types.ts';

function choices(options: unknown) { return ((options as { choices?: Array<{ label: string; imageUrl?: string }> })?.choices ?? []); }
function items(options: unknown) { return ((options as { items?: Array<{ label: string }> })?.items ?? []); }

export function QuizLivePreview({ field }: { field?: EditorField }) {
  if (!field) return <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-8 text-slate-400">Selecione um campo</section>;
  const options = field.options as Record<string, unknown>;
  return (
    <section className="min-h-[560px] rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.16),transparent_32%),#07111a] p-8 shadow-2xl">
      <p className="mb-3 text-xs uppercase tracking-[.24em] text-cyan-200">Preview</p>
      <h2 className="mb-8 text-3xl font-semibold tracking-tight text-white">{field.title}</h2>
      {field.type === 'image_choice' && <div className="grid grid-cols-2 gap-3">{choices(options).map((choice, index) => <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-3"><div className="mb-3 h-24 rounded-2xl bg-slate-700" style={{ backgroundImage: choice.imageUrl ? `url(${choice.imageUrl})` : undefined }} /><span className="text-sm text-white">{choice.label}</span></div>)}</div>}
      {field.type === 'rating' && <div className="flex gap-2 text-3xl">{Array.from({ length: Number(options.max ?? 5) }, (_, index) => <span key={index}>★</span>)}</div>}
      {field.type === 'opinion_scale' && <div><div className="flex flex-wrap gap-2">{Array.from({ length: Number(options.max ?? 10) - Number(options.min ?? 0) + 1 }, (_, i) => <button key={i} className="h-11 w-11 rounded-xl bg-white/10 text-white">{Number(options.min ?? 0) + i}</button>)}</div><div className="mt-3 flex justify-between text-xs text-slate-400"><span>{String(options.labelMin ?? '')}</span><span>{String(options.labelMax ?? '')}</span></div></div>}
      {field.type === 'yes_no' && <div className="grid gap-3 sm:grid-cols-2"><button className="rounded-3xl bg-emerald-300/15 p-6 text-white">{String(options.yesIcon ?? '👍')} {String(options.yesLabel ?? 'Sim')}</button><button className="rounded-3xl bg-red-300/15 p-6 text-white">{String(options.noIcon ?? '👎')} {String(options.noLabel ?? 'Não')}</button></div>}
      {field.type === 'ranking' && <ol className="space-y-3">{items(options).map((item, index) => <li key={index} className="rounded-2xl bg-white/10 p-4 text-white">☰ {index + 1}. {item.label}</li>)}</ol>}
      {field.type === 'slider' && <div><input type="range" className="w-full" min={Number(options.min ?? 0)} max={Number(options.max ?? 100)} readOnly /><div className="mt-2 flex justify-between text-sm text-slate-300"><span>{String(options.min ?? 0)}</span><span>{String(options.max ?? 100)}{String(options.unit ?? '')}</span></div></div>}
      {!['image_choice', 'rating', 'opinion_scale', 'yes_no', 'ranking', 'slider'].includes(field.type) && <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-slate-300">Campo {field.type}</div>}
    </section>
  );
}
