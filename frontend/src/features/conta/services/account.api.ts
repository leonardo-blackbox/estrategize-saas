import { client } from '../../../api/client.ts';

export interface SubscriptionData {
  plan_name: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  credits_available: number;
  credits_per_month: number;
}

export function fetchSubscription(): Promise<{ data: SubscriptionData | null }> {
  return client.get('/api/account/subscription').json();
}

export function createBillingPortalSession(): Promise<{ data: { url: string } }> {
  return client.post('/api/account/billing-portal').json();
}
