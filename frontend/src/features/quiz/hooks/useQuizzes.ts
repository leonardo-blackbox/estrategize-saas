import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createQuiz, deleteQuiz, duplicateQuiz, listQuizzes, quizKeys, type Quiz } from '../services/quiz.api.ts';

export function useQuizzes() {
  return useQuery({ queryKey: quizKeys.lists(), queryFn: listQuizzes, staleTime: 30_000 });
}

export function useCreateQuiz() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuiz,
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
      navigate(`/quiz/${quiz.id}/editor`);
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuiz,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: quizKeys.lists() });
      const previous = queryClient.getQueryData<Quiz[]>(quizKeys.lists()) ?? [];
      queryClient.setQueryData<Quiz[]>(quizKeys.lists(), previous.filter((quiz) => quiz.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(quizKeys.lists(), context?.previous ?? []);
      toast.error('Não foi possível deletar o quiz.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: quizKeys.lists() }),
  });
}

export function useDuplicateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: duplicateQuiz,
    onSuccess: () => {
      toast.success('Quiz duplicado.');
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
}
