import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { updateQuizFields, type Quiz } from '../../services/quiz.api.ts';
import type { FieldType } from '../../../../api/applications.ts';
import { createEditorField, toEditorField, withoutLeadOnOthers } from './quiz-editor.helpers.ts';
import type { EditorField } from './types.ts';
import { QuizFieldsList } from './parts/QuizFieldsList.tsx';
import { QuizLivePreview } from './parts/QuizLivePreview.tsx';
import { QuizFieldOptions } from './parts/QuizFieldOptions.tsx';

interface ShellContext { quiz: Quiz; }

function serialize(fields: EditorField[]) {
  return fields.map((field, index) => ({
    id: field.id,
    type: field.type,
    title: field.title,
    description: field.description,
    required: field.required,
    options: field.options,
    conditional_logic: field.conditional_logic ?? { enabled: false, conditions: [] },
    position: index * 10,
  }));
}

export function QuizEditorPage() {
  const { quiz } = useOutletContext<ShellContext>();
  const [fields, setFields] = useState<EditorField[]>(() => (quiz.fields ?? []).map(toEditorField));
  const [selected, setSelected] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedField = fields[selected];
  const hasLead = useMemo(() => fields.some((field) => Boolean((field.options as { triggerLeadEvent?: boolean } | undefined)?.triggerLeadEvent)), [fields]);
  const suggestedLeadIndex = fields.findIndex((field) => ['phone', 'email'].includes(field.type));

  const scheduleSave = (nextFields: EditorField[]) => {
    setFields(nextFields);
    setSaveStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      updateQuizFields(quiz.id, serialize(nextFields)).then(() => setSaveStatus('saved')).catch(() => { setSaveStatus('error'); toast.error('Erro ao salvar campos.'); });
    }, 1500);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const addField = (type: FieldType) => {
    const thankYouIndex = fields.findIndex((field) => field.type === 'thank_you');
    const insertAt = thankYouIndex === -1 ? fields.length : thankYouIndex;
    const updated = [...fields];
    updated.splice(insertAt, 0, createEditorField(type, insertAt));
    setSelected(insertAt);
    scheduleSave(updated);
  };

  const updateField = (updates: Partial<EditorField>) => {
    scheduleSave(fields.map((field, index) => index === selected ? { ...field, ...updates } : field));
  };

  const toggleLead = () => {
    if (!selectedField) return;
    const active = Boolean((selectedField.options as { triggerLeadEvent?: boolean } | undefined)?.triggerLeadEvent);
    const options = { ...(selectedField.options as Record<string, unknown>), triggerLeadEvent: !active };
    const changed = fields.map((field, index) => index === selected ? { ...field, options } : field);
    scheduleSave(!active ? withoutLeadOnOthers(changed, selectedField.localId) : changed);
  };

  const removeField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index);
    setSelected(Math.max(0, index - 1));
    scheduleSave(updated);
  };

  return (
    <div className="space-y-4">
      {!hasLead && <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(255,159,10,0.3)] bg-[rgba(255,159,10,0.10)] px-4 py-3 text-sm text-[var(--text-primary)]"><span>📡 Nenhum gatilho de Lead configurado. O evento Lead não será disparado.</span>{suggestedLeadIndex >= 0 && <button onClick={() => setSelected(suggestedLeadIndex)} className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-text)]">Configurar</button>}</div>}
      <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]"><span>{fields.length} campos</span><span>{saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo' : 'Erro ao salvar'}</span></div>
      <div className="grid gap-5 xl:grid-cols-[280px_1fr_340px]">
        <QuizFieldsList fields={fields} selected={selected} onSelect={setSelected} onAdd={addField} onRemove={removeField} />
        <QuizLivePreview field={selectedField} />
        <QuizFieldOptions field={selectedField} onChange={updateField} onLeadTrigger={toggleLead} />
      </div>
    </div>
  );
}
