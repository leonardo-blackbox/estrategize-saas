import { useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import { archiveQuiz, publishQuiz, unpublishQuiz, type Quiz } from '../../services/quiz.api.ts';

const statusCopy = {
  draft: ['Rascunho', 'bg-zinc-500/15 text-zinc-300'],
  published: ['Publicado', 'bg-emerald-500/15 text-emerald-300'],
  archived: ['Arquivado', 'bg-amber-500/15 text-amber-300'],
} as const;

interface QuizCardProps {
  quiz: Quiz;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function QuizCard({ quiz, onDelete, onDuplicate }: QuizCardProps) {
  const navigate = useNavigate();
  const [label, tone] = statusCopy[quiz.status];
  const date = new Date(quiz.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const togglePublish = (event: MouseEvent) => {
    event.stopPropagation();
    const action = quiz.status === 'published' ? unpublishQuiz : publishQuiz;
    action(quiz.id).then(() => window.location.reload()).catch(() => undefined);
  };

  return (
    <article onClick={() => navigate(`/quiz/${quiz.id}/editor`)} className="group cursor-pointer rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(24,32,40,.92),rgba(11,15,20,.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,.26)] transition hover:-translate-y-1 hover:border-cyan-300/50">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>
        <button onClick={(event) => { event.stopPropagation(); onDuplicate(quiz.id); }} className="text-xs text-cyan-200 opacity-0 transition group-hover:opacity-100">Duplicar</button>
      </div>
      <h3 className="min-h-12 text-lg font-semibold tracking-tight text-white">{quiz.title}</h3>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-300">
        <span>{quiz.response_count ?? 0} respostas</span>
        <span className="text-right">Criado {date}</span>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={togglePublish} className="min-h-11 flex-1 rounded-full bg-white/10 px-3 text-sm text-white hover:bg-white/15">{quiz.status === 'published' ? 'Despublicar' : 'Publicar'}</button>
        <button onClick={(event) => { event.stopPropagation(); archiveQuiz(quiz.id).then(() => window.location.reload()).catch(() => undefined); }} className="min-h-11 rounded-full bg-white/10 px-3 text-sm text-white hover:bg-white/15">Arquivar</button>
        <button onClick={(event) => { event.stopPropagation(); if (confirm('Deletar este quiz?')) onDelete(quiz.id); }} className="min-h-11 rounded-full bg-red-500/15 px-3 text-sm text-red-200">Del</button>
      </div>
    </article>
  );
}
