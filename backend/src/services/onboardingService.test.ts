import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabaseAdmin before importing the service
vi.mock('../lib/supabaseAdmin.js', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: vi.fn(),
        inviteUserByEmail: vi.fn(),
      },
    },
    from: vi.fn(),
  },
}));

import { processPurchase, processCancellation } from './onboardingService.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const mockAdmin = supabaseAdmin as any;

function makeChain(result: unknown = { data: null, error: null }) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    upsert: () => chain,
    insert: () => chain,
    is: () => chain,
    single: () => chain,
    limit: () => chain,
    order: () => chain,
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

const BASE_EVENT = {
  event_id: 'evt_001',
  customer_email: 'user@example.com',
  customer_name: 'Test User',
  provider: 'stripe',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAdmin.from.mockReturnValue(makeChain());
});

describe('processPurchase', () => {
  it('cria novo usuário quando email não existe', async () => {
    mockAdmin.auth.admin.listUsers.mockResolvedValue({ data: { users: [] } });
    mockAdmin.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null,
    });

    await processPurchase(BASE_EVENT);

    expect(mockAdmin.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({ data: { full_name: 'Test User' } }),
    );
  });

  it('usa usuário existente quando email já existe', async () => {
    mockAdmin.auth.admin.listUsers.mockResolvedValue({
      data: { users: [{ id: 'existing-id', email: 'user@example.com' }] },
    });

    await processPurchase(BASE_EVENT);

    expect(mockAdmin.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it('cria enrollment quando course_id é fornecido', async () => {
    mockAdmin.auth.admin.listUsers.mockResolvedValue({
      data: { users: [{ id: 'user-id', email: 'user@example.com' }] },
    });

    const upsertSpy = vi.fn().mockReturnValue(makeChain({ data: null, error: null }));
    mockAdmin.from.mockReturnValue({ ...makeChain(), upsert: upsertSpy });

    await processPurchase({ ...BASE_EVENT, course_id: 'course-123' });

    // Deve chamar upsert para enrollment
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-id', course_id: 'course-123' }),
      expect.anything(),
    );
  });

  it('lança erro se customer_email estiver ausente', async () => {
    await expect(
      processPurchase({ ...BASE_EVENT, customer_email: '' }),
    ).rejects.toThrow('customer_email required');
  });

  it('lança erro se convite ao usuário falhar', async () => {
    mockAdmin.auth.admin.listUsers.mockResolvedValue({ data: { users: [] } });
    mockAdmin.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { message: 'invite failed' },
    });

    await expect(processPurchase(BASE_EVENT)).rejects.toThrow('Failed to invite user');
  });

  it('é idempotente — segundo processPurchase não recria usuário existente', async () => {
    mockAdmin.auth.admin.listUsers.mockResolvedValue({
      data: { users: [{ id: 'user-id', email: 'user@example.com' }] },
    });

    await processPurchase(BASE_EVENT);
    await processPurchase(BASE_EVENT);

    // Nunca deve chamar invite se usuário já existe
    expect(mockAdmin.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });
});

describe('processCancellation', () => {
  it('registra audit log para usuário existente', async () => {
    mockAdmin.auth.admin.listUsers.mockResolvedValue({
      data: { users: [{ id: 'user-id', email: 'user@example.com' }] },
    });

    const insertSpy = vi.fn().mockReturnValue(makeChain());
    mockAdmin.from.mockReturnValue({ ...makeChain(), insert: insertSpy });

    await processCancellation(BASE_EVENT);

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'subscription_canceled' }),
    );
  });

  it('não faz nada se usuário não existe', async () => {
    mockAdmin.auth.admin.listUsers.mockResolvedValue({ data: { users: [] } });

    const insertSpy = vi.fn();
    mockAdmin.from.mockReturnValue({ ...makeChain(), insert: insertSpy });

    await processCancellation(BASE_EVENT);

    expect(insertSpy).not.toHaveBeenCalled();
  });
});
