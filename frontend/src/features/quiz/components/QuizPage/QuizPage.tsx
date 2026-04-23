import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { QuizCard } from '../QuizCard/index.ts';
import { QuizCreateModal } from '../QuizCreateModal/index.ts';
import { QuizEmptyState } from '../QuizEmptyState/index.ts';
import { useDeleteQuiz, useDuplicateQuiz, useQuizzes } from '../../hooks/useQuizzes.ts';

function QuizSkeleton() {
  return <div className="h-56 animate-pulse rounded-[28px] border border-white/10 bg-white/5" />;
}

export function QuizPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<'active' | 'published' | 'draft' | 'archived'>('active');
  const { data: quizzes = [], isLoading } = useQuizzes();
  const deleteMutation = useDeleteQuiz();
  const duplicateMutation = useDuplicateQuiz();
  const filtered = useMemo(() => quizzes.filter((quiz) => {
    if (filter === 'active') return quiz.status !== 'archived';
    return quiz.status === filter;
  }), [filter, quizzes]);

  return (
    <div className="mx-auto max-w-7xl text-white">
      <section className="relative mb-8 overflow-hidden rounded-[36px] border border-cyan-200/10 bg-[linear-gradient(135deg,#06141f,#0d1b2a_50%,#102a2f)] p-8 shadow-[0_30px_140px_rgba(6,20,31,.42)]">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[.32em] text-cyan-200">Ferramenta Quiz</p>
        <div className="relative mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-.04em] md:text-5xl">Quizzes que segmentam leads enquanto encantam.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Crie diagnósticos com score, resultados personalizados e eventos Meta em uma experiência separada das Aplicações.</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className="min-h-11 rounded-full bg-cyan-300 px-6 text-sm font-semibold text-slate-950 shadow-[0_16px_60px_rgba(34,211,238,.24)]">Novo Quiz</button>
        </div>
      </section>
      <div className="mb-5 flex flex-wrap gap-2">
        {(['active', 'published', 'draft', 'archived'] as const).map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm ${filter === item ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-slate-300'}`}>{item === 'active' ? 'Ativos' : item}</button>
        ))}
      </div>
      {isLoading && <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <QuizSkeleton key={index} />)}</div>}
      {!isLoading && filtered.length === 0 && <QuizEmptyState onCreate={() => setCreateOpen(true)} />}
      {!isLoading && filtered.length > 0 && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} onDelete={deleteMutation.mutate} onDuplicate={duplicateMutation.mutate} />)}
        </motion.div>
      )}
      <QuizCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
