import { useQuery } from '@tanstack/react-query';
import { getInstagramSnapshot } from '../../../api/marketResearch.ts';
import type { InstagramSnapshotResponse } from '../../../types/market-intelligence.ts';

const POLLING_INTERVAL = 5000;
const TERMINAL_STATUSES = new Set(['done', 'failed', 'not_started']);

export function useInstagramSnapshot(consultancyId: string) {
  const { data: snapshot, isLoading, error } = useQuery<InstagramSnapshotResponse>({
    queryKey: ['instagram-snapshot', consultancyId],
    queryFn: () => getInstagramSnapshot(consultancyId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || TERMINAL_STATUSES.has(status)) return false;
      return POLLING_INTERVAL;
    },
    staleTime: 0,
  });

  const isPolling =
    !!snapshot && !TERMINAL_STATUSES.has(snapshot.status);

  return { snapshot, isLoading, isPolling, error };
}
