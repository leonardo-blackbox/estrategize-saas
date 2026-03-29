import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchSubscription, createBillingPortalSession } from '../services/account.api.ts';
import type { SubscriptionData } from '../services/account.api.ts';

export function useSubscription() {
  return useQuery({
    queryKey: ['account-subscription'],
    queryFn: fetchSubscription,
    select: (res) => res.data as SubscriptionData | null,
    staleTime: 60_000,
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: createBillingPortalSession,
    onSuccess: (data) => {
      window.location.href = data.data.url;
    },
  });
}
