import type { ApplicationField } from '../../../../api/applications.ts';
import { DynamicQuizField } from '../fields/QuizFields.tsx';

interface QuizQuestionStepProps { field: ApplicationField; value: unknown; onChange: (value: unknown) => void; onAutoAdvance: (value: unknown) => void; }
export function QuizQuestionStep({ field, value, onChange, onAutoAdvance }: QuizQuestionStepProps) {
  return <section className="rounded-[34px] border border-white/10 bg-white/[.04] p-6 shadow-2xl"><h1 className="mb-6 text-3xl font-semibold tracking-tight text-white">{field.title}</h1>{field.description && <p className="mb-6 text-slate-300">{field.description}</p>}<DynamicQuizField field={field} value={value} onChange={onChange} onAutoAdvance={onAutoAdvance} /></section>;
}
