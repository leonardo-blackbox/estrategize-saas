import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuiz, useToggleQuizStatus, useUpdateQuiz } from '../../hooks/useQuiz.ts';

const tabs = [
  ['editor', 'Editor'], ['resultados', 'Resultados'], ['integracoes', 'Integrações'], ['respostas', 'Respostas'], ['analytics', 'Analytics'],
] as const;
const statusCopy = { draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado' } as const;

export function QuizShell() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: quiz, isLoading, error } = useQuiz(id);
  const titleMutation = useUpdateQuiz(id);
  const statusMutation = useToggleQuizStatus(id, quiz?.status ?? 'draft');
  if (isLoading) return <div className="min-h-screen bg-slate-950 p-8 text-white">Carregando quiz...</div>;
  if (error || !quiz) return <div className="min-h-screen bg-slate-950 p-8 text-white">Quiz não encontrado.</div>;
  const publicUrl = `${window.location.origin}/q/${quiz.slug}`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_34%),#061018] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => navigate('/quiz')} className="rounded-full bg-white/10 px-3 py-2 text-sm text-slate-200">←</button>
            <input defaultValue={quiz.title} onBlur={(event) => event.target.value !== quiz.title && titleMutation.mutate(event.target.value)} className="min-w-0 bg-transparent text-xl font-semibold outline-none" />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-cyan-100">{statusCopy[quiz.status]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quiz.status === 'published' && <button onClick={() => window.open(publicUrl, '_blank')} className="rounded-full bg-white/10 px-4 py-2 text-sm">Ver quiz</button>}
            {quiz.status === 'published' && <button onClick={() => navigator.clipboard.writeText(publicUrl).then(() => toast.success('Link copiado!'))} className="rounded-full bg-white/10 px-4 py-2 text-sm">Copiar link</button>}
            <button onClick={() => statusMutation.mutate()} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">{quiz.status === 'published' ? 'Despublicar' : 'Publicar'}</button>
          </div>
        </div>
        <nav className="mx-auto mt-4 flex max-w-7xl gap-2 overflow-x-auto">
          {tabs.map(([path, label]) => <NavLink key={path} to={`/quiz/${id}/${path}`} className={({ isActive }) => `rounded-full px-4 py-2 text-sm ${isActive ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-slate-300'}`}>{label}</NavLink>)}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8"><Outlet context={{ quiz }} /></main>
    </div>
  );
}
