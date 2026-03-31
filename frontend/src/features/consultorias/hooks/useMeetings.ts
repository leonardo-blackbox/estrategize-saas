import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listMeetings, createMeeting, deleteMeeting, meetingKeys, type CreateMeetingPayload } from '../../../api/meetings';

const TERMINAL = new Set(['done', 'error']);

export function useMeetings(consultancyId: string) {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: meetingKeys.byConsultancy(consultancyId),
    queryFn: () => listMeetings(consultancyId),
    // Polling: ativa enquanto existir qualquer sessão não-terminal
    refetchInterval: (query) => {
      const sessions = query.state.data?.sessions ?? [];
      const hasActive = sessions.some((s) => !TERMINAL.has(s.status));
      return hasActive ? 5000 : false;
    },
  });

  const sessions = data?.sessions ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: CreateMeetingPayload) => createMeeting(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meetingKeys.byConsultancy(consultancyId) });
      toast.success('Bot ativado com sucesso');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao ativar bot'),
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => deleteMeeting(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meetingKeys.byConsultancy(consultancyId) });
      toast.success('Reunião excluída');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao excluir reunião'),
  });

  return {
    sessions,
    isLoading,
    error: error as Error | null,
    createSession: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    deleteSession: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}
