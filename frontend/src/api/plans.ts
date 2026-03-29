import { client } from './client.ts';

export interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  credits: number;
  billing_interval: 'month' | 'year' | 'one_time';
}

export function listPublicPlans() {
  return client.get('/api/plans').json<{ data: PublicPlan[] }>();
}
