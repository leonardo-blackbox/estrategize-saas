import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchQuiz, publishQuiz, quizKeys, unpublishQuiz, updateQuiz } from '../services/quiz.api.ts';

export function useQuiz(id: string) {
  return useQuery({ queryKey: quizKeys.detail(id), queryFn: () => fetchQuiz(id), staleTime: 30_000, enabled: Boolean(id) });
}

export function useUpdateQuiz(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => updateQuiz(id, { title }),
    onSuccess: (quiz) => queryClient.setQueryData(quizKeys.detail(id), quiz),
  });
}

export function useToggleQuizStatus(id: string, status: 'draft' | 'published' | 'archived') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => (status === 'published' ? unpublishQuiz(id) : publishQuiz(id)),
    onSuccess: (quiz) => queryClient.setQueryData(quizKeys.detail(id), quiz),
  });
}
