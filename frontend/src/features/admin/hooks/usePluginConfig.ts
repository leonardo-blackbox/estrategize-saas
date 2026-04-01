import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPluginConfig, updatePluginConfig } from '../../../api/pluginConfig.ts';
import type { PesquisaMercadoConfig } from '../../../types/market-intelligence.ts';

export function usePluginConfig(slug: string) {
  const queryClient = useQueryClient();
  const queryKey = ['plugin-config', slug] as const;

  const { data: config, isLoading, error } = useQuery<PesquisaMercadoConfig>({
    queryKey,
    queryFn: () => getPluginConfig(slug),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (partial: Partial<PesquisaMercadoConfig>) => updatePluginConfig(slug, partial),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
    },
  });

  return {
    config,
    isLoading,
    error,
    updateConfig: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    updateSuccess: mutation.isSuccess,
  };
}
