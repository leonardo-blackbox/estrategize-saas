import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// Hoisted mocks for service functions
const { mockGetBalance, mockReserve, mockConsume, mockRelease, mockGrant, mockList } = vi.hoisted(
  () => ({
    mockGetBalance: vi.fn(),
    mockReserve: vi.fn(),
    mockConsume: vi.fn(),
    mockRelease: vi.fn(),
    mockGrant: vi.fn(),
    mockList: vi.fn(),
  }),
);

// Mock the credit service
vi.mock('../services/creditService.js', () => ({
  getBalance: mockGetBalance,
  reserveCredits: mockReserve,
  consumeCredits: mockConsume,
  releaseCredits: mockRelease,
  grantCredits: mockGrant,
  listTransactions: mockList,
}));

// Mock the auth middleware to inject a fake userId
vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req: AuthenticatedRequest, _res: Response, next: () => void) => {
    req.userId = 'test-user-id';
    next();
  },
}));

// Dynamic import AFTER mocks are set up
const { default: creditsRouter } = await import('./credits.js');

// Build a minimal Express app for testing
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/credits', creditsRouter);
  return app;
}

// Simple request helper (no extra deps needed)
async function request(
  app: express.Express,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('Could not get server address'));
        return;
      }
      const port = addr.port;
      const url = `http://127.0.0.1:${port}${path}`;
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) options.body = JSON.stringify(body);

      fetch(url, options)
        .then(async (res) => {
          const json = await res.json();
          server.close();
          resolve({ status: res.status, body: json });
        })
        .catch((err) => {
          server.close();
          reject(err);
        });
    });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// GET /api/credits/balance
// ============================================================================

describe('GET /api/credits/balance', () => {
  it('returns balance data', async () => {
    const balance = { available: 10, reserved: 2, total_consumed: 5, consumed_this_month: 3, transaction_count: 20 };
    mockGetBalance.mockResolvedValue(balance);

    const app = buildApp();
    const res = await request(app, 'GET', '/api/credits/balance');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: balance });
    expect(mockGetBalance).toHaveBeenCalledWith('test-user-id');
  });

  it('returns 500 on service error', async () => {
    mockGetBalance.mockRejectedValue(new Error('DB down'));

    const app = buildApp();
    const res = await request(app, 'GET', '/api/credits/balance');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'DB down' });
  });
});

// ============================================================================
// POST /api/credits/reserve
// ============================================================================

describe('POST /api/credits/reserve', () => {
  it('returns 201 with reservation_id', async () => {
    mockReserve.mockResolvedValue('res-uuid-123');

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/reserve', {
      amount: 3,
      idempotency_key: 'idem-1',
      reference_id: 'ref-1',
      description: 'Test',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { reservation_id: 'res-uuid-123' } });
    expect(mockReserve).toHaveBeenCalledWith('test-user-id', 3, 'idem-1', 'ref-1', 'Test');
  });

  it('returns 400 for invalid amount', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/reserve', { amount: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(mockReserve).not.toHaveBeenCalled();
  });

  it('returns 400 for missing amount', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/reserve', {});

    expect(res.status).toBe(400);
  });

  it('returns 402 for insufficient credits', async () => {
    const err = new Error('Insufficient credits') as Error & { statusCode: number };
    err.statusCode = 402;
    mockReserve.mockRejectedValue(err);

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/reserve', { amount: 100 });

    expect(res.status).toBe(402);
    expect(res.body.error).toBe('Insufficient credits');
  });
});

// ============================================================================
// POST /api/credits/consume
// ============================================================================

describe('POST /api/credits/consume', () => {
  it('returns 200 on success', async () => {
    mockConsume.mockResolvedValue(true);

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/consume', {
      reservation_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 400 for invalid UUID', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/consume', {
      reservation_id: 'not-a-uuid',
    });

    expect(res.status).toBe(400);
  });

  it('returns 404 when reservation not found', async () => {
    mockConsume.mockRejectedValue(new Error('Reservation not found: some-id'));

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/consume', {
      reservation_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(res.status).toBe(404);
  });

  it('returns 409 when reservation already processed', async () => {
    mockConsume.mockRejectedValue(new Error('Reservation already processed: some-id'));

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/consume', {
      reservation_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(res.status).toBe(409);
  });
});

// ============================================================================
// POST /api/credits/release
// ============================================================================

describe('POST /api/credits/release', () => {
  it('returns 200 on success', async () => {
    mockRelease.mockResolvedValue(true);

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/release', {
      reservation_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 404 when reservation not found', async () => {
    mockRelease.mockRejectedValue(new Error('Reservation not found: id'));

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/release', {
      reservation_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(res.status).toBe(404);
  });

  it('returns 409 when already processed', async () => {
    mockRelease.mockRejectedValue(new Error('Reservation already processed: id'));

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/release', {
      reservation_id: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(res.status).toBe(409);
  });
});

// ============================================================================
// POST /api/credits/grant
// ============================================================================

describe('POST /api/credits/grant', () => {
  it('returns 201 with transaction_id', async () => {
    mockGrant.mockResolvedValue('tx-uuid-789');

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/grant', {
      amount: 10,
      type: 'purchase',
      description: 'Bought credits',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { transaction_id: 'tx-uuid-789' } });
  });

  it('returns 400 for invalid amount', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/grant', { amount: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid type', async () => {
    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/grant', {
      amount: 10,
      type: 'invalid_type',
    });

    expect(res.status).toBe(400);
  });

  it('returns 500 on service error', async () => {
    mockGrant.mockRejectedValue(new Error('grant failed'));

    const app = buildApp();
    const res = await request(app, 'POST', '/api/credits/grant', { amount: 10 });

    expect(res.status).toBe(500);
  });
});

// ============================================================================
// GET /api/credits/transactions
// ============================================================================

describe('GET /api/credits/transactions', () => {
  it('returns transactions list', async () => {
    const txns = [{ id: 'tx-1', type: 'purchase', amount: 10 }];
    mockList.mockResolvedValue(txns);

    const app = buildApp();
    const res = await request(app, 'GET', '/api/credits/transactions');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: txns });
  });

  it('passes pagination params', async () => {
    mockList.mockResolvedValue([]);

    const app = buildApp();
    await request(app, 'GET', '/api/credits/transactions?limit=10&offset=20');

    expect(mockList).toHaveBeenCalledWith('test-user-id', 10, 20);
  });

  it('caps limit at 100', async () => {
    mockList.mockResolvedValue([]);

    const app = buildApp();
    await request(app, 'GET', '/api/credits/transactions?limit=999');

    expect(mockList).toHaveBeenCalledWith('test-user-id', 100, 0);
  });

  it('returns 500 on service error', async () => {
    mockList.mockRejectedValue(new Error('query failed'));

    const app = buildApp();
    const res = await request(app, 'GET', '/api/credits/transactions');

    expect(res.status).toBe(500);
  });
});
