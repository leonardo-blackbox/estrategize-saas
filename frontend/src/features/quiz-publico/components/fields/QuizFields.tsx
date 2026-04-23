import type { ApplicationField } from '../../../../api/applications.ts';

type Choice = { label: string; value: string; imageUrl?: string };
function options(field: ApplicationField) { return (field.options ?? {}) as Record<string, unknown>; }
function choices(field: ApplicationField) { return ((options(field).choices as Choice[] | undefined) ?? []); }
interface FieldProps { field: ApplicationField; value: unknown; onChange: (value: unknown) => void; onAutoAdvance: (value: unknown) => void; }

export function DynamicQuizField({ field, value, onChange, onAutoAdvance }: FieldProps) {
  const opts = options(field);
  if (field.type === 'short_text' || field.type === 'name' || field.type === 'email' || field.type === 'phone') return <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none" />;
  if (field.type === 'long_text') return <textarea value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/10 p-4 text-white outline-none" />;
  if (field.type === 'number' || field.type === 'date') return <input type={field.type === 'date' ? 'date' : 'number'} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-white outline-none" />;
  if (['multiple_choice', 'image_choice'].includes(field.type)) return <div className="grid gap-3 sm:grid-cols-2">{choices(field).map((choice) => <button key={choice.value} onClick={() => onAutoAdvance(choice.value)} className={`min-h-20 rounded-3xl border p-4 text-left text-white ${value === choice.value ? 'border-cyan-300 bg-cyan-300/15' : 'border-white/10 bg-white/5'}`}>{field.type === 'image_choice' && <div className="mb-3 h-28 rounded-2xl bg-slate-700 bg-cover bg-center" style={{ backgroundImage: choice.imageUrl ? `url(${choice.imageUrl})` : undefined }} />}{choice.label}</button>)}</div>;
  if (field.type === 'yes_no') return <div className="grid gap-3 sm:grid-cols-2"><button onClick={() => onAutoAdvance('yes')} className="min-h-24 rounded-3xl bg-emerald-300/15 text-xl text-white">{String(opts.yesIcon ?? '👍')} {String(opts.yesLabel ?? 'Sim')}</button><button onClick={() => onAutoAdvance('no')} className="min-h-24 rounded-3xl bg-red-300/15 text-xl text-white">{String(opts.noIcon ?? '👎')} {String(opts.noLabel ?? 'Não')}</button></div>;
  if (field.type === 'rating') return <div className="flex flex-wrap gap-2">{Array.from({ length: Number(opts.max ?? 5) }, (_, i) => <button key={i} onClick={() => onAutoAdvance(i + 1)} className="h-12 w-12 rounded-2xl bg-white/10 text-xl text-white">{opts.style === 'number' ? i + 1 : '★'}</button>)}</div>;
  if (field.type === 'opinion_scale') return <div className="flex flex-wrap gap-2">{Array.from({ length: Number(opts.max ?? 10) - Number(opts.min ?? 0) + 1 }, (_, i) => <button key={i} onClick={() => onChange(Number(opts.min ?? 0) + i)} className="h-11 w-11 rounded-xl bg-white/10 text-white">{Number(opts.min ?? 0) + i}</button>)}</div>;
  if (field.type === 'ranking') return <RankingField field={field} value={value} onChange={onChange} />;
  if (field.type === 'slider') return <div><input type="range" min={Number(opts.min ?? 0)} max={Number(opts.max ?? 100)} step={Number(opts.step ?? 1)} value={Number(value ?? opts.min ?? 0)} onChange={(event) => onChange(Number(event.target.value))} className="w-full" /><p className="mt-3 text-center text-white">{String(value ?? opts.min ?? 0)}{String(opts.unit ?? '')}</p></div>;
  if (field.type === 'message') return <div className="rounded-3xl bg-white/5 p-5 text-slate-200">{field.description ?? field.title}</div>;
  return <input value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-2xl bg-white/10 px-4 text-white" />;
}

function RankingField({ field, value, onChange }: { field: ApplicationField; value: unknown; onChange: (value: unknown) => void }) {
  const items = ((options(field).items as Array<{ id: string; label: string }> | undefined) ?? []);
  const order = Array.isArray(value) ? value as string[] : items.map((item) => item.id);
  const move = (index: number, direction: -1 | 1) => {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return <ol className="space-y-3">{order.map((id, index) => <li key={id} className="flex items-center justify-between rounded-2xl bg-white/10 p-4 text-white"><span>☰ {items.find((item) => item.id === id)?.label ?? id}</span><span><button onClick={() => move(index, -1)}>▲</button> <button onClick={() => move(index, 1)}>▼</button></span></li>)}</ol>;
}
