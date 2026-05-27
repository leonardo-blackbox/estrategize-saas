/**
 * useMetaInsights — fetch oficial Account/Media/Audience insights da consultoria.
 * Epic 10, Story 10.5.
 *
 * Só dispara fetches quando há conexão ativa.
 */
import { useQuery } from '@tanstack/react-query';
import {
  fetchAccountInsights,
  fetchMediaInsights,
  fetchAudienceInsights,
  type AccountInsightsResponse,
  type MediaWithInsights,
  type AudienceResponse,
} from '../../../api/meta.ts';

export function useMetaInsights(consultancyId: string | undefined, enabled: boolean) {
  const account = useQuery<AccountInsightsResponse>({
    queryKey: ['meta-insights', consultancyId, 'account'],
    queryFn: () => fetchAccountInsights(consultancyId as string),
    enabled: Boolean(consultancyId) && enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const media = useQuery<{ items: MediaWithInsights[]; nextCursor: string | null }>({
    queryKey: ['meta-insights', consultancyId, 'media'],
    queryFn: () => fetchMediaInsights(consultancyId as string, 25),
    enabled: Boolean(consultancyId) && enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const audience = useQuery<AudienceResponse>({
    queryKey: ['meta-insights', consultancyId, 'audience'],
    queryFn: () => fetchAudienceInsights(consultancyId as string),
    enabled: Boolean(consultancyId) && enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    account: account.data,
    media: media.data?.items,
    audience: audience.data,
    isLoading: account.isLoading || media.isLoading || audience.isLoading,
    error: account.error ?? media.error ?? audience.error,
  };
}
