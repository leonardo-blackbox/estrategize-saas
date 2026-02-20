import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// ============================================================================
// Types
// ============================================================================

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
// Helpers
// ============================================================================

function ensureAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Database service unavailable');
  }
  return supabaseAdmin;
}

// ============================================================================
// Balance
// ============================================================================

export async function getBalance(userId: string): Promise<CreditBalance> {
  const db = ensureAdmin();

  const { data, error } = await db.rpc('get_credit_balance', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to get credit balance: ${error.message}`);
  }

  // RPC returns an array with one row
  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    // No transactions yet — zero balance
    return {
      available: 0,
      reserved: 0,
      total_consumed: 0,
      consumed_this_month: 0,
      transaction_count: 0,
    };
  }

  return {
    available: row.available ?? 0,
    reserved: row.reserved ?? 0,
    total_consumed: row.total_consumed ?? 0,
    consumed_this_month: row.consumed_this_month ?? 0,
    transaction_count: Number(row.transaction_count ?? 0),
  };
}

// ============================================================================
// Reserve
// ============================================================================

export async function reserveCredits(
  userId: string,
  amount: number,
  idempotencyKey?: string,
  referenceId?: string,
  description?: string,
): Promise<string> {
  const db = ensureAdmin();

  const { data, error } = await db.rpc('reserve_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_idempotency_key: idempotencyKey ?? null,
    p_reference_id: referenceId ?? null,
    p_description: description ?? null,
  });

  if (error) {
    // Check for insufficient credits (custom error code P0001)
    if (error.message.includes('Insufficient credits')) {
      const err = new Error(error.message);
      (err as Error & { statusCode: number }).statusCode = 402;
      throw err;
    }
    throw new Error(`Failed to reserve credits: ${error.message}`);
  }

  return data as string;
}

// ============================================================================
// Consume
// ============================================================================

export async function consumeCredits(
  userId: string,
  reservationId: string,
): Promise<boolean> {
  const db = ensureAdmin();

  const { data, error } = await db.rpc('consume_credits', {
    p_user_id: userId,
    p_reservation_id: reservationId,
  });

  if (error) {
    // Reservation not found (P0002) or already processed (P0003)
    if (error.message.includes('not found')) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }
    if (error.message.includes('already processed')) {
      throw new Error(`Reservation already processed: ${reservationId}`);
    }
    throw new Error(`Failed to consume credits: ${error.message}`);
  }

  return data as boolean;
}

// ============================================================================
// Release
// ============================================================================

export async function releaseCredits(
  userId: string,
  reservationId: string,
): Promise<boolean> {
  const db = ensureAdmin();

  const { data, error } = await db.rpc('release_credits', {
    p_user_id: userId,
    p_reservation_id: reservationId,
  });

  if (error) {
    if (error.message.includes('not found')) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }
    if (error.message.includes('already processed')) {
      throw new Error(`Reservation already processed: ${reservationId}`);
    }
    throw new Error(`Failed to release credits: ${error.message}`);
  }

  return data as boolean;
}

// ============================================================================
// Grant (purchase / monthly_grant)
// ============================================================================

export async function grantCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'monthly_grant' = 'purchase',
  description = 'Manual credit grant',
): Promise<string> {
  const db = ensureAdmin();

  const { data, error } = await db.rpc('grant_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
  });

  if (error) {
    throw new Error(`Failed to grant credits: ${error.message}`);
  }

  return data as string;
}

// ============================================================================
// Atomic Reserve + Consume (convenience for single-step operations)
// ============================================================================

/**
 * Performs a full credit cycle: reserve -> action -> consume/release.
 * If the action succeeds, credits are consumed.
 * If the action fails, credits are released back.
 *
 * @returns The result of the action function
 */
export async function withCreditCharge<T>(
  userId: string,
  amount: number,
  action: (reservationId: string) => Promise<T>,
  options?: {
    idempotencyKey?: string;
    referenceId?: string;
    description?: string;
  },
): Promise<T> {
  // Step 1: Reserve credits
  const reservationId = await reserveCredits(
    userId,
    amount,
    options?.idempotencyKey,
    options?.referenceId,
    options?.description,
  );

  try {
    // Step 2: Execute the action
    const result = await action(reservationId);

    // Step 3: Consume credits on success
    await consumeCredits(userId, reservationId);

    return result;
  } catch (err) {
    // Step 3 (failure): Release credits back
    try {
      await releaseCredits(userId, reservationId);
    } catch (releaseErr) {
      console.error(
        `CRITICAL: Failed to release reservation ${reservationId} after action failure:`,
        releaseErr,
      );
    }
    throw err;
  }
}

// ============================================================================
// Expire stale reservations
// ============================================================================

/**
 * Release all pending reservations older than the given minutes.
 * Intended to be called by a cron/scheduled task.
 */
export async function expireStaleReservations(
  olderThanMinutes = 30,
): Promise<number> {
  const db = ensureAdmin();

  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();

  // Find stale pending reservations
  const { data: stale, error: fetchError } = await db
    .from('credit_transactions')
    .select('id, user_id')
    .eq('type', 'reserve')
    .eq('status', 'pending')
    .lt('created_at', cutoff);

  if (fetchError) {
    throw new Error(`Failed to fetch stale reservations: ${fetchError.message}`);
  }

  if (!stale || stale.length === 0) {
    return 0;
  }

  let released = 0;
  for (const row of stale) {
    try {
      await releaseCredits(row.user_id, row.id);
      released++;
    } catch {
      console.error(`Failed to expire reservation ${row.id}`);
    }
  }

  return released;
}

// ============================================================================
// Transaction History
// ============================================================================

export async function listTransactions(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<CreditTransaction[]> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to list transactions: ${error.message}`);
  }

  return data as CreditTransaction[];
}
