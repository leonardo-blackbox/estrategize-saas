import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMarketResearch, startMarketResearch, manualRagIndex } from '../../../api/marketResearch.ts';
import type { MarketResearchResponse } from '../../../types/market-intelligence.ts';

const POLLING_INTERVAL = 5000;

function isRunning(status: string | undefined): boolean {
  if (!status) return false;
  return status === 'pending' || status.startsWith('running_');
}

export function useMarketResearch(consultancyId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['market-research', consultancyId] as const;

  const { data: research, isLoading } = useQuery<MarketResearchResponse>({
    queryKey,
    queryFn: () => getMarketResearch(consultancyId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return isRunning(status) ? POLLING_INTERVAL : false;
    },
    staleTime: 0,
  });

  const isPolling = isRunning(research?.status);

  const startMutation = useMutation({
    mutationFn: () => startMarketResearch(consultancyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const ragIndexMutation = useMutation({
    mutationFn: () => manualRagIndex(consultancyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    research: research ?? null,
    isLoading,
    isPolling,
    startResearch: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    startError: startMutation.error,
    manualRagIndex: ragIndexMutation.mutateAsync,
    isIndexing: ragIndexMutation.isPending,
  };
}
