import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { QuizActions } from '../QuizActions/index.ts';
import { QuizError } from '../QuizError/index.ts';
import { QuizLoading } from '../QuizLoading/index.ts';
import { QuizProgressBar } from '../QuizProgressBar/index.ts';
import { QuizQuestionStep } from '../QuizQuestionStep/index.ts';
import { QuizWelcomeScreen } from '../QuizWelcomeScreen/index.ts';
import { useQuizPublico } from '../../hooks/useQuizPublico.ts';

const autoAdvanceTypes = ['image_choice', 'yes_no', 'rating', 'multiple_choice'];

export function QuizPublicoAggregator() {
  const { slug = '' } = useParams();
  const [search] = useSearchParams();
  const flow = useQuizPublico(slug, search.get('preview') === '1');
  const currentField = flow.fields[flow.index];
  const currentValue = flow.currentAnswer?.value;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === 'Enter' && currentField && !['ranking', 'long_text'].includes(currentField.type)) flow.next(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentField, flow]);

  if (flow.state === 'loading') return <QuizLoading />;
  if (flow.state === 'error' || !flow.quiz) return <QuizError />;
  if (flow.state === 'welcome') return <QuizWelcomeScreen quiz={flow.quiz} onStart={flow.start} />;
  if (flow.state === 'submitting') return <QuizLoading />;
  if (flow.state === 'score_reveal' || flow.state === 'result') return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Resultado em construção...</div>;
  if (!currentField) return <QuizError />;

  const autoAdvance = (value: unknown) => {
    flow.answerCurrent(value);
    window.setTimeout(() => flow.next(), 300);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_36%),#061018] px-5 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <QuizProgressBar index={flow.index} total={flow.fields.length} />
        <QuizQuestionStep field={currentField} value={currentValue} onChange={flow.answerCurrent} onAutoAdvance={autoAdvance} />
        <QuizActions canGoBack={flow.index > 0} onBack={flow.prev} onNext={flow.next} showNext={!autoAdvanceTypes.includes(currentField.type)} />
      </div>
    </main>
  );
}
