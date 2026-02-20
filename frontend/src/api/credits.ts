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

// ============================================================================
// Read operations
// ============================================================================

export function fetchBalance(): Promise<{ data: CreditBalance }> {
  return apiFetch('/api/credits/balance');
}

export function fetchTransactions(
  limit = 50,
  offset = 0,
): Promise<{ data: CreditTransaction[] }> {
  return apiFetch(`/api/credits/transactions?limit=${limit}&offset=${offset}`);
}

// ============================================================================
// Write operations
// ============================================================================

export function reserveCredits(params: {
  amount: number;
  idempotency_key?: string;
  reference_id?: string;
  description?: string;
}): Promise<{ data: { reservation_id: string } }> {
  return apiFetch('/api/credits/reserve', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function consumeCredits(
  reservationId: string,
): Promise<{ ok: boolean }> {
  return apiFetch('/api/credits/consume', {
    method: 'POST',
    body: JSON.stringify({ reservation_id: reservationId }),
  });
}

export function releaseCredits(
  reservationId: string,
): Promise<{ ok: boolean }> {
  return apiFetch('/api/credits/release', {
    method: 'POST',
    body: JSON.stringify({ reservation_id: reservationId }),
  });
}

export function grantCredits(params: {
  amount: number;
  type?: 'purchase' | 'monthly_grant';
  description?: string;
}): Promise<{ data: { transaction_id: string } }> {
  return apiFetch('/api/credits/grant', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
