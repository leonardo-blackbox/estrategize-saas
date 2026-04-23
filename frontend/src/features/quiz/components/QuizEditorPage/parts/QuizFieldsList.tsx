import { QUIZ_FIELD_TYPE_OPTIONS, type FieldType } from '../../../../../api/applications.ts';
import { FIELD_LABELS } from '../quiz-editor.helpers.ts';
import type { EditorField } from '../types.ts';

const basicTypes: FieldType[] = ['short_text', 'long_text', 'name', 'email', 'phone', 'multiple_choice', 'number', 'date'];
interface QuizFieldsListProps { fields: EditorField[]; selected: number; onSelect: (index: number) => void; onAdd: (type: FieldType) => void; onRemove: (index: number) => void; }

export function QuizFieldsList({ fields, selected, onSelect, onAdd, onRemove }: QuizFieldsListProps) {
  return (
    <aside className="rounded-[28px] border border-white/10 bg-white/[.04] p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[.24em] text-cyan-200">Campos</h2>
      <div className="space-y-2">
        {fields.map((field, index) => {
          const trigger = Boolean((field.options as { triggerLeadEvent?: boolean } | undefined)?.triggerLeadEvent);
          return <button key={field.localId} onClick={() => onSelect(index)} className={`min-h-12 w-full rounded-2xl px-3 text-left text-sm ${selected === index ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-slate-200'}`}>
            <span className="font-semibold">{index + 1}. {field.title || FIELD_LABELS[field.type]}</span>{trigger && <span title="Gatilho de Lead Meta configurado neste campo" className="float-right">📡</span>}
          </button>;
        })}
      </div>
      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-slate-400">Básicos</p>
        <div className="grid grid-cols-2 gap-2">{basicTypes.map((type) => <button key={type} onClick={() => onAdd(type)} className="rounded-xl bg-white/5 px-2 py-2 text-xs text-slate-200">{FIELD_LABELS[type]}</button>)}</div>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-slate-400">Campos de Quiz</p>
        <div className="grid grid-cols-2 gap-2">{QUIZ_FIELD_TYPE_OPTIONS.map((item) => <button key={item.type} onClick={() => onAdd(item.type)} className="rounded-xl bg-cyan-300/10 px-2 py-2 text-xs text-cyan-100">{item.label}</button>)}</div>
      </div>
      {fields[selected] && <button onClick={() => onRemove(selected)} className="mt-5 w-full rounded-full bg-red-500/15 px-3 py-2 text-sm text-red-200">Remover selecionado</button>}
    </aside>
  );
}
