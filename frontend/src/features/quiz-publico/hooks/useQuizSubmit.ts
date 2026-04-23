import { useMutation } from '@tanstack/react-query';
import { submitQuiz, type QuizAnswer } from '../services/quiz-publico.api.ts';

export function useQuizSubmit(slug: string) {
  return useMutation({ mutationFn: ({ answers, metadata }: { answers: QuizAnswer[]; metadata: Record<string, unknown> }) => submitQuiz(slug, answers, metadata) });
}
