import { useQuery } from '@tanstack/react-query';
import { centralApi } from '../services/central.api.ts';
import { centralKeys } from './useCentralPages.ts';

export function useCentralPage(consultancyId: string, pageId: string | null) {
  return useQuery({
    queryKey: pageId ? centralKeys.page(consultancyId, pageId) : ['central', consultancyId, 'page', 'none'],
    queryFn: () => centralApi.get(consultancyId, pageId as string),
    enabled: !!consultancyId && !!pageId,
    staleTime: 5_000,
  });
}
