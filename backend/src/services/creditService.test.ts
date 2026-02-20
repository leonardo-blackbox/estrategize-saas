import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must use vi.hoisted so the fns exist when the hoisted vi.mock runs
const { mockRpc, mockFrom } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('../lib/supabaseAdmin.js', () => ({
  supabaseAdmin: {
    rpc: mockRpc,
    from: mockFrom,
  },
}));

import {
  getBalance,
  reserveCredits,
  consumeCredits,
  releaseCredits,
  grantCredits,
  withCreditCharge,
  expireStaleReservations,
  listTransactions,
} from './creditService.js';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// getBalance
// ============================================================================

describe('getBalance', () => {
  it('returns balance from RPC result array', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          available: 10,
          reserved: 2,
          total_consumed: 5,
          consumed_this_month: 3,
          transaction_count: 20,
        },
      ],
      error: null,
    });

    const balance = await getBalance('user-1');

    expect(mockRpc).toHaveBeenCalledWith('get_credit_balance', { p_user_id: 'user-1' });
    expect(balance).toEqual({
      available: 10,
      reserved: 2,
      total_consumed: 5,
      consumed_this_month: 3,
      transaction_count: 20,
    });
  });

  it('returns zero balance when no data', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const balance = await getBalance('user-1');

    expect(balance).toEqual({
      available: 0,
      reserved: 0,
      total_consumed: 0,
      consumed_this_month: 0,
      transaction_count: 0,
    });
  });

  it('handles single object response (non-array)', async () => {
    mockRpc.mockResolvedValue({
      data: {
        available: 5,
        reserved: 1,
        total_consumed: 2,
        consumed_this_month: 1,
        transaction_count: 8,
      },
      error: null,
    });

    const balance = await getBalance('user-1');

    expect(balance.available).toBe(5);
  });

  it('throws on RPC error', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'DB connection failed' },
    });

    await expect(getBalance('user-1')).rejects.toThrow('Failed to get credit balance');
  });
});

// ============================================================================
// reserveCredits
// ============================================================================

describe('reserveCredits', () => {
  it('returns reservation ID on success', async () => {
    mockRpc.mockResolvedValue({ data: 'res-uuid-123', error: null });

    const id = await reserveCredits('user-1', 3, 'idem-key', 'ref-1', 'Test reserve');

    expect(mockRpc).toHaveBeenCalledWith('reserve_credits', {
      p_user_id: 'user-1',
      p_amount: 3,
      p_idempotency_key: 'idem-key',
      p_reference_id: 'ref-1',
      p_description: 'Test reserve',
    });
    expect(id).toBe('res-uuid-123');
  });

  it('passes null for optional params when not provided', async () => {
    mockRpc.mockResolvedValue({ data: 'res-uuid-456', error: null });

    await reserveCredits('user-1', 1);

    expect(mockRpc).toHaveBeenCalledWith('reserve_credits', {
      p_user_id: 'user-1',
      p_amount: 1,
      p_idempotency_key: null,
      p_reference_id: null,
      p_description: null,
    });
  });

  it('throws 402 error for insufficient credits', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Insufficient credits' },
    });

    try {
      await reserveCredits('user-1', 100);
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      expect(error.message).toBe('Insufficient credits');
      expect(error.statusCode).toBe(402);
    }
  });

  it('throws generic error for other failures', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Some DB error' },
    });

    await expect(reserveCredits('user-1', 1)).rejects.toThrow('Failed to reserve credits');
  });
});

// ============================================================================
// consumeCredits
// ============================================================================

describe('consumeCredits', () => {
  it('returns true on success', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    const result = await consumeCredits('user-1', 'res-uuid-123');

    expect(mockRpc).toHaveBeenCalledWith('consume_credits', {
      p_user_id: 'user-1',
      p_reservation_id: 'res-uuid-123',
    });
    expect(result).toBe(true);
  });

  it('throws when reservation not found', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Reservation not found' },
    });

    await expect(consumeCredits('user-1', 'bad-id')).rejects.toThrow(
      'Reservation not found: bad-id',
    );
  });

  it('throws when reservation already processed', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Reservation already processed' },
    });

    await expect(consumeCredits('user-1', 'done-id')).rejects.toThrow(
      'Reservation already processed: done-id',
    );
  });

  it('throws generic error for unknown failures', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'unexpected' },
    });

    await expect(consumeCredits('user-1', 'id')).rejects.toThrow('Failed to consume credits');
  });
});

// ============================================================================
// releaseCredits
// ============================================================================

describe('releaseCredits', () => {
  it('returns true on success', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    const result = await releaseCredits('user-1', 'res-uuid-123');

    expect(mockRpc).toHaveBeenCalledWith('release_credits', {
      p_user_id: 'user-1',
      p_reservation_id: 'res-uuid-123',
    });
    expect(result).toBe(true);
  });

  it('throws when reservation not found', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Reservation not found' },
    });

    await expect(releaseCredits('user-1', 'bad-id')).rejects.toThrow(
      'Reservation not found: bad-id',
    );
  });

  it('throws when reservation already processed', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Reservation already processed' },
    });

    await expect(releaseCredits('user-1', 'done-id')).rejects.toThrow(
      'Reservation already processed: done-id',
    );
  });
});

// ============================================================================
// grantCredits
// ============================================================================

describe('grantCredits', () => {
  it('returns transaction ID on success', async () => {
    mockRpc.mockResolvedValue({ data: 'tx-uuid-789', error: null });

    const id = await grantCredits('user-1', 10, 'purchase', 'Bought 10 credits');

    expect(mockRpc).toHaveBeenCalledWith('grant_credits', {
      p_user_id: 'user-1',
      p_amount: 10,
      p_type: 'purchase',
      p_description: 'Bought 10 credits',
    });
    expect(id).toBe('tx-uuid-789');
  });

  it('uses default type and description when not provided', async () => {
    mockRpc.mockResolvedValue({ data: 'tx-uuid', error: null });

    await grantCredits('user-1', 5);

    expect(mockRpc).toHaveBeenCalledWith('grant_credits', {
      p_user_id: 'user-1',
      p_amount: 5,
      p_type: 'purchase',
      p_description: 'Manual credit grant',
    });
  });

  it('throws on error', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'grant failed' },
    });

    await expect(grantCredits('user-1', 10)).rejects.toThrow('Failed to grant credits');
  });
});

// ============================================================================
// withCreditCharge
// ============================================================================

describe('withCreditCharge', () => {
  it('reserves, executes action, and consumes on success', async () => {
    // reserve_credits returns reservation ID
    mockRpc.mockResolvedValueOnce({ data: 'res-id', error: null });
    // consume_credits returns true
    mockRpc.mockResolvedValueOnce({ data: true, error: null });

    const action = vi.fn().mockResolvedValue('action-result');

    const result = await withCreditCharge('user-1', 1, action, {
      idempotencyKey: 'key-1',
      referenceId: 'ref-1',
      description: 'test charge',
    });

    expect(result).toBe('action-result');
    expect(action).toHaveBeenCalledWith('res-id');

    // First call: reserve_credits
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'reserve_credits', expect.objectContaining({
      p_user_id: 'user-1',
      p_amount: 1,
    }));
    // Second call: consume_credits
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'consume_credits', {
      p_user_id: 'user-1',
      p_reservation_id: 'res-id',
    });
  });

  it('releases credits when action fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'res-id', error: null }); // reserve
    mockRpc.mockResolvedValueOnce({ data: true, error: null }); // release

    const action = vi.fn().mockRejectedValue(new Error('AI call failed'));

    await expect(
      withCreditCharge('user-1', 1, action),
    ).rejects.toThrow('AI call failed');

    // Second call should be release_credits (not consume)
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'release_credits', {
      p_user_id: 'user-1',
      p_reservation_id: 'res-id',
    });
  });

  it('propagates action error even if release fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'res-id', error: null }); // reserve
    // release fails
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'release failed' } });

    const action = vi.fn().mockRejectedValue(new Error('original error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      withCreditCharge('user-1', 1, action),
    ).rejects.toThrow('original error');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('throws 402 when reserve fails due to insufficient credits', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Insufficient credits' },
    });

    const action = vi.fn();

    try {
      await withCreditCharge('user-1', 1, action);
      expect.fail('Should have thrown');
    } catch (err) {
      const error = err as Error & { statusCode?: number };
      expect(error.statusCode).toBe(402);
    }

    // Action should never be called
    expect(action).not.toHaveBeenCalled();
  });
});

// ============================================================================
// expireStaleReservations
// ============================================================================

describe('expireStaleReservations', () => {
  it('returns 0 when no stale reservations', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ select: mockSelect });

    const count = await expireStaleReservations(30);

    expect(count).toBe(0);
  });

  it('releases stale reservations and returns count', async () => {
    const staleRows = [
      { id: 'stale-1', user_id: 'user-a' },
      { id: 'stale-2', user_id: 'user-b' },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ data: staleRows, error: null }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ select: mockSelect });

    // release_credits RPC calls succeed
    mockRpc.mockResolvedValue({ data: true, error: null });

    const count = await expireStaleReservations(30);

    expect(count).toBe(2);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it('continues on individual release failure', async () => {
    const staleRows = [
      { id: 'stale-1', user_id: 'user-a' },
      { id: 'stale-2', user_id: 'user-b' },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ data: staleRows, error: null }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ select: mockSelect });

    // First release fails, second succeeds
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
      .mockResolvedValueOnce({ data: true, error: null });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const count = await expireStaleReservations(30);

    expect(count).toBe(1);
    consoleSpy.mockRestore();
  });

  it('throws on fetch error', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ select: mockSelect });

    await expect(expireStaleReservations()).rejects.toThrow('Failed to fetch stale reservations');
  });
});

// ============================================================================
// listTransactions
// ============================================================================

describe('listTransactions', () => {
  it('returns transactions with default pagination', async () => {
    const txns = [
      { id: 'tx-1', type: 'purchase', amount: 10 },
      { id: 'tx-2', type: 'reserve', amount: 1 },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: txns, error: null }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await listTransactions('user-1');

    expect(result).toEqual(txns);
    expect(mockFrom).toHaveBeenCalledWith('credit_transactions');
  });

  it('applies custom limit and offset', async () => {
    const mockRange = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: mockRange,
        }),
      }),
    });
    mockFrom.mockReturnValue({ select: mockSelect });

    await listTransactions('user-1', 10, 20);

    // range(offset, offset + limit - 1) = range(20, 29)
    expect(mockRange).toHaveBeenCalledWith(20, 29);
  });

  it('throws on error', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({ data: null, error: { message: 'query failed' } }),
        }),
      }),
    });
    mockFrom.mockReturnValue({ select: mockSelect });

    await expect(listTransactions('user-1')).rejects.toThrow('Failed to list transactions');
  });
});
