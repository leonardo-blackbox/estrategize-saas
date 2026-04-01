import { useQuery } from '@tanstack/react-query';
import { listAllMeetings, meetingKeys } from '../../../api/meetings.ts';

export function useReunioes() {
  const { data, isLoading, isError } = useQuery({
    queryKey: meetingKeys.all,
    queryFn: listAllMeetings,
    refetchInterval: (query) => {
      const sessions = query.state.data?.sessions ?? [];
      const hasActive = sessions.some((s) =>
        s.status === 'pending' || s.status === 'joining' || s.status === 'in_call',
      );
      if (hasActive) return 5_000;
      const hasProcessing = sessions.some(
        (s) => s.status === 'processing' || (s.status === 'done' && !s.summary),
      );
      return hasProcessing ? 10_000 : false;
    },
  });

  const sessions = data?.sessions ?? [];
  const totalMeetings = sessions.length;
  const totalTranscricoes = sessions.filter((s) => s.status === 'done' && s.summary).length;

  return { sessions, isLoading, isError, totalMeetings, totalTranscricoes };
}
