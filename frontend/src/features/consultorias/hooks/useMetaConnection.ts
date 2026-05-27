/**
 * useMetaConnection — React Query hook para estado da conexão Meta de uma consultoria.
 * Epic 10, Story 10.2
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMetaConnection,
  startMetaOAuth,
  disconnectMeta,
  type MetaConnectionPublic,
} from '../../../api/meta.ts';

export function useMetaConnection(consultancyId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<MetaConnectionPublic | null>({
    queryKey: ['meta-connection', consultancyId],
    queryFn: () => fetchMetaConnection(consultancyId as string),
    enabled: Boolean(consultancyId),
    staleTime: 30_000,
  });

  const connect = useMutation({
    mutationFn: () => startMetaOAuth(consultancyId as string),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectMeta(consultancyId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-connection', consultancyId] });
      queryClient.invalidateQueries({ queryKey: ['meta-insights', consultancyId] });
    },
  });

  return {
    connection: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    connect: connect.mutate,
    isConnecting: connect.isPending,
    disconnect: disconnect.mutate,
    isDisconnecting: disconnect.isPending,
  };
}
