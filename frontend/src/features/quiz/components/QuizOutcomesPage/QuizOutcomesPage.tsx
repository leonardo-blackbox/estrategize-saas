import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listQuizOutcomes, quizKeys, saveQuizOutcomes, type Quiz, type QuizOutcome } from '../../services/quiz.api.ts';
import { OutcomeCard } from './OutcomeCard.tsx';
import { OutcomeEditorPanel } from './OutcomeEditorPanel.tsx';
import { ScoreRangeBar } from './ScoreRangeBar.tsx';

interface ShellContext { quiz: Quiz; }
const defaults: QuizOutcome[] = [
  { outcome_key: 'iniciante', title: 'Iniciante', score_min: 0, score_max: 40, cta_type: 'none', order: 0, background_color: '#38bdf8' },
  { outcome_key: 'intermediario', title: 'Em Desenvolvimento', score_min: 41, score_max: 70, cta_type: 'none', order: 10, background_color: '#fbbf24' },
  { outcome_key: 'avancado', title: 'Pronto para o Próximo Nível', score_min: 71, score_max: 100, cta_type: 'none', order: 20, background_color: '#34d399' },
];

export function QuizOutcomesPage() {
  const { quiz } = useOutletContext<ShellContext>();
  const { data = [], isLoading } = useQuery({ queryKey: quizKeys.outcomes(quiz.id), queryFn: () => listQuizOutcomes(quiz.id) });
  const [outcomes, setOutcomes] = useState<QuizOutcome[]>([]);
  const [selected, setSelected] = useState(0);
  const [saveStatus, setSaveStatus] = useState('Salvo');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) return;
    const initial = data.length > 0 ? data : defaults;
    setOutcomes(initial);
    if (data.length === 0) saveQuizOutcomes(quiz.id, defaults).catch(() => undefined);
  }, [data, isLoading, quiz.id]);

  const scheduleSave = (next: QuizOutcome[]) => {
    setOutcomes(next);
    setSaveStatus('Salvando...');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveQuizOutcomes(quiz.id, next).then((saved) => { setOutcomes(saved); setSaveStatus('Salvo'); }).catch(() => setSaveStatus('Erro')), 1500);
  };

  const updateSelected = (updates: Partial<QuizOutcome>) => scheduleSave(outcomes.map((outcome, index) => index === selected ? { ...outcome, ...updates } : outcome));
  const addOutcome = () => {
    if (outcomes.length >= 10) return;
    const next = { outcome_key: `resultado-${Date.now()}`, title: 'Novo resultado', score_min: 0, score_max: 100, cta_type: 'none' as const, order: outcomes.length * 10 };
    setSelected(outcomes.length);
    scheduleSave([...outcomes, next]);
  };
  const removeOutcome = (index: number) => {
    if (!confirm('Excluir este resultado?')) return;
    scheduleSave(outcomes.filter((_, itemIndex) => itemIndex !== index));
    setSelected(0);
  };

  if (isLoading) return <div className="rounded-3xl border border-white/10 bg-white/[.04] p-8 text-slate-300">Carregando resultados...</div>;
  return (
    <div className="space-y-5">
      <ScoreRangeBar outcomes={outcomes} />
      <div className="flex justify-end"><button disabled={outcomes.length >= 10} onClick={addOutcome} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">Adicionar resultado</button></div>
      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="grid gap-4 md:grid-cols-2">{outcomes.map((outcome, index) => <OutcomeCard key={outcome.outcome_key} outcome={outcome} active={selected === index} onEdit={() => setSelected(index)} onDelete={() => removeOutcome(index)} />)}</div>
        <OutcomeEditorPanel outcome={outcomes[selected]} onChange={updateSelected} saveStatus={saveStatus} />
      </div>
    </div>
  );
}
