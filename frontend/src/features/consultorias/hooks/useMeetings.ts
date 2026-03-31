import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMeetings, createMeeting, meetingKeys, type CreateMeetingPayload } from '../../../api/meetings';

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
    },
  });

  return {
    sessions,
    isLoading,
    error: error as Error | null,
    createSession: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}
