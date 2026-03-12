import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import {
  adminGetUser,
  adminGrantEntitlement,
  adminRevokeEntitlement,
  adminGetUserCreditTransactions,
  adminGetUserCreditBalance,
  adminAdjustCredits,
  adminUpdateUserProfile,
  adminGetUserProgress,
  adminGetUserAuditLogs,
} from '../../api/courses.ts';

// ─── Types ────────────────────────────────────────────────────────
type TabId = 'overview' | 'courses' | 'credits' | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'courses', label: 'Cursos & Acesso' },
  { id: 'credits', label: 'Créditos' },
  { id: 'history', label: 'Histórico' },
];

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso?: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} dias atrás`;
  return formatDate(iso);
}

const ACCESS_LABELS: Record<string, string> = {
  allow: 'Permitido',
  deny: 'Bloqueado',
  full_access: 'Acesso Total',
};

const ACCESS_VARIANT: Record<string, string> = {
  allow: 'text-[var(--text-primary)] bg-[var(--bg-hover)]',
  full_access: 'text-[var(--text-primary)] bg-[var(--bg-hover)]',
  deny: 'text-[var(--text-tertiary)] bg-[var(--bg-surface-1)] opacity-60',
};

const TX_TYPE_LABEL: Record<string, string> = {
  purchase: 'Compra',
  monthly_grant: 'Mensal',
  reserve: 'Reserva',
  consume: 'Consumo',
  release: 'Liberação',
};

const TX_TYPE_COLOR: Record<string, string> = {
  purchase: 'text-emerald-500',
  monthly_grant: 'text-emerald-500',
  release: 'text-emerald-500',
  reserve: 'text-amber-500',
  consume: 'text-red-500',
};

// ─── Tab: Overview ────────────────────────────────────────────────
function TabOverview({
  detail,
  userId,
  onProfileUpdated,
}: {
  detail: any;
  userId: string;
  onProfileUpdated: () => void;
}) {
  const qc = useQueryClient();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<'member' | 'admin'>('member');

  const roleMutation = useMutation({
    mutationFn: (role: 'member' | 'admin') => adminUpdateUserProfile(userId, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', userId] });
      setShowRoleModal(false);
      onProfileUpdated();
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () =>
      adminGrantEntitlement(userId, { access: 'deny', reason: 'admin_suspend' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', userId] });
    },
  });

  const { data: creditBalance } = useQuery({
    queryKey: ['admin-user-credit-balance', userId],
    queryFn: () => adminGetUserCreditBalance(userId),
  });

  const profile = detail.profile;
  const authUser = detail.authUser;
  const sub = (profile?.subscriptions ?? [])[0];

  const balance = creditBalance?.available ?? 0;

  const isSuspended = (detail.entitlements ?? []).some(
    (e: any) => e.access === 'deny' && !e.course_id,
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Perfil
          </p>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
              {(profile?.full_name ?? authUser?.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {profile?.full_name ?? '—'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">
                {authUser?.email ?? '—'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                  {profile?.role ?? 'member'}
                </span>
                {isSuspended && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/15 text-red-500">
                    Suspenso
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--text-tertiary)] space-y-1 pt-1 border-t border-[var(--border-hairline)]">
            <div className="flex justify-between">
              <span>Cadastro</span>
              <span className="text-[var(--text-secondary)]">{formatDate(authUser?.created_at ?? profile?.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Auth info card */}
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Acesso
          </p>
          <div className="text-xs space-y-2">
            <div className="flex justify-between items-start gap-2">
              <span className="text-[var(--text-tertiary)] shrink-0">Último acesso</span>
              <span className="text-[var(--text-secondary)] text-right">
                {authUser?.last_sign_in_at
                  ? timeAgo(authUser.last_sign_in_at)
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-[var(--text-tertiary)] shrink-0">Email verificado</span>
              <span className={cn(
                'text-right',
                authUser?.email_confirmed_at ? 'text-emerald-500' : 'text-red-500',
              )}>
                {authUser?.email_confirmed_at
                  ? formatDate(authUser.email_confirmed_at)
                  : 'Não verificado'}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-[var(--text-tertiary)] shrink-0">Saldo de créditos</span>
              <span className={cn(
                'font-semibold',
                balance < 0 ? 'text-red-500' : 'text-[var(--text-primary)]',
              )}>
                {balance.toLocaleString('pt-BR')} cr
              </span>
            </div>
          </div>
        </div>

        {/* Plan card */}
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Plano
          </p>
          {sub ? (
            <div className="text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  {(sub as any).plans?.name ?? 'Plano'}
                </span>
                <span className={cn(
                  'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                  (sub as any).status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : (sub as any).status === 'past_due'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]',
                )}>
                  {(sub as any).status}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-tertiary)]">
                <span>Renova em</span>
                <span>{formatDate((sub as any).current_period_end)}</span>
              </div>
              {(sub as any).plans?.credits_per_month && (
                <div className="flex justify-between text-[var(--text-tertiary)]">
                  <span>Créditos/mês</span>
                  <span>{(sub as any).plans.credits_per_month}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-tertiary)]">Sem plano ativo</p>
          )}
        </div>

        {/* Actions card */}
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Ações
          </p>
          <div className="space-y-2">
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setNewRole(profile?.role === 'admin' ? 'member' : 'admin');
                setShowRoleModal(true);
              }}
            >
              Alterar role
              <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">
                atual: {profile?.role ?? 'member'}
              </span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-400"
              onClick={() => suspendMutation.mutate()}
              disabled={suspendMutation.isPending || isSuspended}
            >
              {isSuspended ? 'Acesso suspenso' : 'Suspender acesso'}
            </Button>
          </div>
        </div>
      </div>

      {/* Role modal */}
      <Modal open={showRoleModal} onClose={() => setShowRoleModal(false)} className="sm:max-w-xs">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Alterar role</h2>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Novo role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'member' | 'admin')}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => roleMutation.mutate(newRole)}
              disabled={roleMutation.isPending}
            >
              {roleMutation.isPending ? 'Salvando...' : 'Confirmar'}
            </Button>
            <Button variant="ghost" onClick={() => setShowRoleModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Tab: Courses ─────────────────────────────────────────────────
function TabCourses({ detail, userId }: { detail: any; userId: string }) {
  const qc = useQueryClient();
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({
    course_id: '',
    access: 'allow' as 'allow' | 'deny' | 'full_access',
    reason: '',
    expires_at: '',
  });

  const grantMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminGrantEntitlement>[1]) =>
      adminGrantEntitlement(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', userId] });
      setShowGrantModal(false);
      setGrantForm({ course_id: '', access: 'allow', reason: '', expires_at: '' });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (entitlementId: string) => adminRevokeEntitlement(userId, entitlementId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-user', userId] }),
  });

  const { data: progressData } = useQuery({
    queryKey: ['admin-user-progress', userId],
    queryFn: () => adminGetUserProgress(userId),
  });

  const progress = (progressData as any)?.progress ?? [];

  return (
    <>
      <div className="space-y-6">
        {/* Entitlements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Entitlements ({(detail.entitlements ?? []).length})
            </h3>
            <Button size="sm" onClick={() => setShowGrantModal(true)}>
              + Entitlement
            </Button>
          </div>
          {(detail.entitlements ?? []).length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">Sem entitlements.</p>
          ) : (
            <div className="space-y-2">
              {(detail.entitlements as any[]).map((ent: any) => (
                <div
                  key={ent.id}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {ent.courses?.title ?? 'Acesso global'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                        ACCESS_VARIANT[ent.access] ?? ACCESS_VARIANT.allow,
                      )}>
                        {ACCESS_LABELS[ent.access] ?? ent.access}
                      </span>
                      {ent.expires_at && (
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          Expira {formatDate(ent.expires_at)}
                        </span>
                      )}
                      {ent.reason && (
                        <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[140px]">
                          {ent.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeMutation.mutate(ent.id)}
                    disabled={revokeMutation.isPending}
                    className="shrink-0 text-[10px] text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                  >
                    Revogar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrollments */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Matrículas ({(detail.enrollments ?? []).length})
          </h3>
          {(detail.enrollments ?? []).length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">Sem matrículas.</p>
          ) : (
            <div className="space-y-2">
              {(detail.enrollments as any[]).map((enr: any) => {
                const prog = progress.find((p: any) => p.course_id === enr.course_id);
                return (
                  <div
                    key={enr.id}
                    className="rounded-[var(--radius-sm)] px-3 py-2.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {enr.courses?.title ?? enr.course_id}
                      </p>
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                        {formatDate(enr.enrolled_at)}
                      </span>
                    </div>
                    {prog && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
                          <span>Progresso</span>
                          <span>{prog.completed_lessons}/{prog.total_lessons} aulas</span>
                        </div>
                        <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--text-primary)] rounded-full"
                            style={{
                              width: prog.total_lessons > 0
                                ? `${Math.round((prog.completed_lessons / prog.total_lessons) * 100)}%`
                                : '0%',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grant entitlement modal */}
      <Modal open={showGrantModal} onClose={() => setShowGrantModal(false)} className="sm:max-w-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Conceder Entitlement
          </h2>
          <div className="space-y-3">
            <Input
              label="ID do Curso (vazio = acesso global)"
              value={grantForm.course_id}
              onChange={(e) => setGrantForm((f) => ({ ...f, course_id: e.target.value }))}
              placeholder="uuid do curso..."
            />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Tipo de acesso
              </label>
              <select
                value={grantForm.access}
                onChange={(e) => setGrantForm((f) => ({ ...f, access: e.target.value as any }))}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
              >
                <option value="allow">Permitido</option>
                <option value="full_access">Acesso Total (ignora drip)</option>
                <option value="deny">Bloqueado</option>
              </select>
            </div>
            <Input
              label="Motivo (opcional)"
              value={grantForm.reason}
              onChange={(e) => setGrantForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Ex: Bonus, parceria..."
            />
            <Input
              label="Expira em (opcional)"
              type="date"
              value={grantForm.expires_at}
              onChange={(e) => setGrantForm((f) => ({ ...f, expires_at: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1"
              onClick={() => grantMutation.mutate({
                course_id: grantForm.course_id || undefined,
                access: grantForm.access,
                reason: grantForm.reason || undefined,
                expires_at: grantForm.expires_at || null,
              })}
              disabled={grantMutation.isPending}
            >
              {grantMutation.isPending ? 'Salvando...' : 'Conceder'}
            </Button>
            <Button variant="ghost" onClick={() => setShowGrantModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Tab: Credits ─────────────────────────────────────────────────
function TabCredits({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [adjustForm, setAdjustForm] = useState({ amount: '', description: '' });
  const [adjustError, setAdjustError] = useState('');
  const limit = 20;
  const offset = page * limit;

  const { data: txData, isLoading } = useQuery({
    queryKey: ['admin-user-credits', userId, offset],
    queryFn: () => adminGetUserCreditTransactions(userId, { limit, offset }),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: { amount: number; description: string }) =>
      adminAdjustCredits(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-credits', userId] });
      setAdjustForm({ amount: '', description: '' });
      setAdjustError('');
    },
    onError: (e: any) => setAdjustError(e.message ?? 'Erro ao ajustar créditos'),
  });

  const tx = (txData as any)?.transactions ?? [];
  const total = (txData as any)?.total ?? 0;
  const balance = (txData as any)?.balance ?? 0;
  const reserved = (txData as any)?.reserved ?? 0;
  const consumedThisMonth = (txData as any)?.consumed_this_month ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleAdjust = () => {
    const amount = Number(adjustForm.amount);
    if (!amount || isNaN(amount)) {
      setAdjustError('Informe um valor diferente de zero');
      return;
    }
    if (!adjustForm.description.trim()) {
      setAdjustError('Descrição é obrigatória');
      return;
    }
    setAdjustError('');
    adjustMutation.mutate({ amount, description: adjustForm.description.trim() });
  };

  return (
    <div className="space-y-6">
      {/* Balance + adjust */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
          <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
            Saldo atual
          </p>
          <p className={cn(
            'text-3xl font-bold',
            balance < 0 ? 'text-red-500' : 'text-[var(--text-primary)]',
          )}>
            {balance.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">créditos disponíveis</p>
          {reserved > 0 && (
            <p className="text-xs text-amber-500 mt-1">{reserved} reservados</p>
          )}
          {consumedThisMonth > 0 && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{consumedThisMonth} usados este mês</p>
          )}
        </div>

        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            Ajuste manual
          </p>
          <Input
            label="Valor (+ adicionar / − remover)"
            type="number"
            value={adjustForm.amount}
            onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Ex: 50 ou -10"
          />
          <Input
            label="Descrição"
            value={adjustForm.description}
            onChange={(e) => setAdjustForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Motivo do ajuste..."
          />
          {adjustError && (
            <p className="text-xs text-red-500">{adjustError}</p>
          )}
          <Button
            size="sm"
            className="w-full"
            onClick={handleAdjust}
            disabled={adjustMutation.isPending}
          >
            {adjustMutation.isPending ? 'Aplicando...' : 'Aplicar ajuste'}
          </Button>
        </div>
      </div>

      {/* Transaction list */}
      <div>
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          Histórico de transações ({total})
        </h3>

        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-12 mb-1 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)]" />
          ))
        ) : tx.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)]">Nenhuma transação registrada.</p>
        ) : (
          <div className="space-y-1">
            {tx.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--bg-hover)]',
                      TX_TYPE_COLOR[t.type] ?? 'text-[var(--text-tertiary)]',
                    )}>
                      {TX_TYPE_LABEL[t.type] ?? t.type}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] truncate">
                      {t.description ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn(
                    'text-sm font-semibold',
                    ['purchase', 'monthly_grant', 'release'].includes(t.type)
                      ? 'text-emerald-500'
                      : ['consume', 'reserve'].includes(t.type)
                        ? 'text-red-500'
                        : 'text-[var(--text-primary)]',
                  )}>
                    {['purchase', 'monthly_grant', 'release'].includes(t.type) ? '+' : '-'}{t.amount}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {formatDate(t.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-[var(--text-tertiary)]">
              {offset + 1}–{Math.min(offset + limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: History ─────────────────────────────────────────────────
function TabHistory({ userId }: { userId: string }) {
  const [page, setPage] = useState(0);
  const limit = 20;
  const offset = page * limit;

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['admin-user-audit', userId, offset],
    queryFn: () => adminGetUserAuditLogs(userId, { limit, offset }),
  });

  const logs = (auditData as any)?.data ?? [];
  const total = (auditData as any)?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        Ações registradas ({total})
      </h3>

      {isLoading ? (
        [1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)]" />
        ))
      ) : logs.length === 0 ? (
        <p className="text-xs text-[var(--text-tertiary)]">Nenhuma ação registrada para este usuário.</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log: any) => (
            <div
              key={log.id}
              className="px-3 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {log.action}
                    </span>
                    {log.profiles?.full_name && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        por {log.profiles.full_name}
                      </span>
                    )}
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5 truncate">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                  {formatDateTime(log.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">
            {offset + 1}–{Math.min(offset + limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: userDetail, isLoading, error } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminGetUser(id!),
    enabled: !!id,
  });

  const detail = userDetail as any;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-[var(--bg-surface-1)]" />
        <div className="h-8 w-64 rounded bg-[var(--bg-surface-1)]" />
        <div className="h-10 rounded bg-[var(--bg-surface-1)]" />
        <div className="h-48 rounded bg-[var(--bg-surface-1)]" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link to="/admin/usuarios" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          ← Usuários
        </Link>
        <div className="mt-8 text-center">
          <p className="text-sm text-red-500">Usuário não encontrado.</p>
          <Button className="mt-4" onClick={() => navigate('/admin/usuarios')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const displayName = detail.profile?.full_name ?? detail.authUser?.email ?? id;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Breadcrumb */}
      <motion.div variants={staggerItem} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Link
          to="/admin/usuarios"
          className="hover:text-[var(--text-secondary)] transition-colors"
        >
          ← Usuários
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] truncate max-w-[200px]">{displayName}</span>
      </motion.div>

      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">{displayName}</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{detail.authUser?.email}</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-1 border-b border-[var(--border-hairline)] overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab content */}
      <motion.div variants={staggerItem}>
        {activeTab === 'overview' && (
          <TabOverview
            detail={detail}
            userId={id!}
            onProfileUpdated={() => qc.invalidateQueries({ queryKey: ['admin-users'] })}
          />
        )}
        {activeTab === 'courses' && (
          <TabCourses detail={detail} userId={id!} />
        )}
        {activeTab === 'credits' && (
          <TabCredits userId={id!} />
        )}
        {activeTab === 'history' && (
          <TabHistory userId={id!} />
        )}
      </motion.div>
    </motion.div>
  );
}
