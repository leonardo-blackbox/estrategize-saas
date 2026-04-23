import type { PublicQuizData } from '../../services/quiz-publico.api.ts';

export function QuizWelcomeScreen({ quiz, onStart }: { quiz: PublicQuizData; onStart: () => void }) {
  const welcome = quiz.fields.find((field) => field.type === 'welcome');
  const options = (welcome?.options ?? {}) as { buttonText?: string; description?: string };
  return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,.22),transparent_34%),#061018] p-6 text-center text-white"><section className="max-w-2xl"><h1 className="text-5xl font-semibold tracking-[-.05em]">{welcome?.title ?? quiz.application.title}</h1><p className="mt-5 text-lg leading-8 text-slate-300">{options.description ?? 'Responda algumas perguntas e descubra seu resultado.'}</p><button onClick={onStart} className="mt-8 min-h-12 rounded-full bg-cyan-300 px-8 font-semibold text-slate-950">{options.buttonText ?? 'Começar'}</button></section></main>;
}
