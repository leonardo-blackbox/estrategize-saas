import { useQuery } from '@tanstack/react-query';
import { listPublicPlans, type PublicPlan } from '../../../api/plans.ts';

export function usePlans() {
  return useQuery<{ data: PublicPlan[] }, Error, PublicPlan[]>({
    queryKey: ['public-plans'],
    queryFn: listPublicPlans,
    staleTime: 5 * 60 * 1000,
    select: (res) => res.data,
  });
}
