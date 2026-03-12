import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ─── Hoisted mocks ──────────────────────────────────────────────
const { mockGetBalance } = vi.hoisted(() => ({
  mockGetBalance: vi.fn(),
}));

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('../../services/creditService.js', () => ({
  getBalance: mockGetBalance,
}));

vi.mock('../../lib/supabaseAdmin.js', () => ({
  supabaseAdmin: {
    from: mockFrom,
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: null } }),
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }),
      },
    },
  },
}));

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: vi.fn((req: any, _res: any, next: any) => {
    req.userId = 'admin-actor-id';
    next();
  }),
}));

vi.mock('../../middleware/admin.js', () => ({
  requireAdmin: vi.fn((_req: any, _res: any, next: any) => next()),
}));

// Import AFTER mocks are set up
import usersRouter from './users.js';

// ─── Helpers ────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/', usersRouter);
  return app;
}

/** Creates a chainable Supabase query mock that resolves to `result` at the end */
function makeChain(result: any) {
  const chain: any = {};
  const methods = ['select', 'eq', 'order', 'range', 'in', 'single', 'update', 'insert', 'ilike'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // The terminal call returns the result as a resolved promise
  // We make the chain itself thenable so `await chain` works
  chain.then = (resolve: any) => resolve(result);
  return chain;
}

const DEFAULT_BALANCE = {
  available: 42,
  reserved: 0,
  total_consumed: 8,
  consumed_this_month: 2,
  transaction_count: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetBalance.mockResolvedValue(DEFAULT_BALANCE);
});

// ============================================================================
// GET /:id/credit-balance
// ============================================================================

describe('GET /:id/credit-balance', () => {
  it('returns all balance fields from RPC', async () => {
    const app = buildApp();
    const res = await request(app).get('/user-123/credit-balance');

    expect(res.status).toBe(200);
    expect(mockGetBalance).toHaveBeenCalledWith('user-123');
    expect(res.body).toEqual(DEFAULT_BALANCE);
  });

  it('returns 500 when getBalance throws', async () => {
    mockGetBalance.mockRejectedValue(new Error('RPC failed'));
    const app = buildApp();
    const res = await request(app).get('/user-123/credit-balance');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('RPC failed');
  });
});

// ============================================================================
// GET /:id/credit-transactions
// ============================================================================

describe('GET /:id/credit-transactions', () => {
  it('returns balance.available (not naive sum) via getBalance', async () => {
    const txChain = makeChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(txChain);

    const app = buildApp();
    const res = await request(app).get('/user-123/credit-transactions');

    expect(res.status).toBe(200);
    expect(mockGetBalance).toHaveBeenCalledWith('user-123');
    expect(res.body.balance).toBe(42);
    expect(res.body.reserved).toBe(0);
    expect(res.body.consumed_this_month).toBe(2);
    expect(res.body.total_consumed).toBe(8);
  });

  it('respects limit and offset pagination params', async () => {
    const txChain = makeChain({ data: [], error: null, count: 100 });
    mockFrom.mockReturnValue(txChain);

    const app = buildApp();
    const res = await request(app).get('/user-123/credit-transactions?limit=10&offset=20');

    expect(res.status).toBe(200);
    expect(txChain.range).toHaveBeenCalledWith(20, 29);
  });

  it('returns 500 on DB error', async () => {
    const txChain = makeChain({ data: null, error: { message: 'DB error' }, count: null });
    mockFrom.mockReturnValue(txChain);

    const app = buildApp();
    const res = await request(app).get('/user-123/credit-transactions');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB error');
  });
});

// ============================================================================
// POST /:id/credits
// ============================================================================

describe('POST /:id/credits', () => {
  it('positive amount inserts type=purchase with Math.abs(amount)', async () => {
    const insertChain = makeChain({ data: { id: 'tx-1', amount: 50, type: 'purchase' }, error: null });
    const auditChain = makeChain({ data: null, error: null });
    mockFrom
      .mockReturnValueOnce(insertChain)  // credit_transactions
      .mockReturnValueOnce(auditChain);  // audit_logs

    const app = buildApp();
    const res = await request(app)
      .post('/user-123/credits')
      .send({ amount: 50, description: 'Bonus manual' });

    expect(res.status).toBe(201);
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 50, type: 'purchase' }),
    );
  });

  it('negative amount inserts type=consume with Math.abs(amount)', async () => {
    const insertChain = makeChain({ data: { id: 'tx-2', amount: 10, type: 'consume' }, error: null });
    const auditChain = makeChain({ data: null, error: null });
    mockFrom
      .mockReturnValueOnce(insertChain)
      .mockReturnValueOnce(auditChain);

    const app = buildApp();
    const res = await request(app)
      .post('/user-123/credits')
      .send({ amount: -10, description: 'Estorno manual' });

    expect(res.status).toBe(201);
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10, type: 'consume' }),
    );
  });

  it('returns 400 when amount is zero', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/user-123/credits')
      .send({ amount: 0, description: 'Test' });

    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns 400 when description is empty', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/user-123/credits')
      .send({ amount: 10, description: '' });

    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ============================================================================
// PATCH /:id
// ============================================================================

describe('PATCH /:id', () => {
  it('updates role and records audit log', async () => {
    const profileChain = makeChain({ data: { id: 'user-123', role: 'admin' }, error: null });
    const auditChain = makeChain({ data: null, error: null });
    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(auditChain);

    const app = buildApp();
    const res = await request(app)
      .patch('/user-123')
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(auditChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin_update_profile' }),
    );
  });

  it('returns 400 when body is empty', async () => {
    const app = buildApp();
    const res = await request(app)
      .patch('/user-123')
      .send({});

    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
