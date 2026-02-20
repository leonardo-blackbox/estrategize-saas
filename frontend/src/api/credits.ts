import { apiFetch } from './client.ts';

export interface CreditBalance {
  available: number;
  reserved: number;
  total_consumed: number;
  consumed_this_month: number;
  transaction_count: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'monthly_grant' | 'reserve' | 'consume' | 'release';
  status: 'pending' | 'confirmed' | 'released';
  idempotency_key: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export function fetchBalance(): Promise<{ data: CreditBalance }> {
  return apiFetch('/api/credits/balance');
}

export function fetchTransactions(
  limit = 50,
  offset = 0,
): Promise<{ data: CreditTransaction[] }> {
  return apiFetch(`/api/credits/transactions?limit=${limit}&offset=${offset}`);
}
