import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../lib/cn.ts';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import {
  adminGrantEntitlement,
  adminUpdateUserProfile,
  adminGetUserCreditBalance,
} from '../../services/admin.api.ts';
import { formatDate, timeAgo } from '../../helpers/format.ts';

interface TabOverviewProps {
  detail: any;
  userId: string;
  onProfileUpdated: () => void;
}

export function AdminUserDetailTabOverview({ detail, userId, onProfileUpdated }: TabOverviewProps) {
  const qc = useQueryClient();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<'member' | 'admin'>('member');

  const roleMutation = useMutation({
    mutationFn: (role: 'member' | 'admin') => adminUpdateUserProfile(userId, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', userId] }); setShowRoleModal(false); onProfileUpdated(); },
  });

  const suspendMutation = useMutation({
    mutationFn: () => adminGrantEntitlement(userId, { access: 'deny', reason: 'admin_suspend' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', userId] }); },
  });

  const { data: creditBalance } = useQuery({
    queryKey: ['admin-user-credit-balance', userId],
    queryFn: () => adminGetUserCreditBalance(userId),
  });

  const profile = detail.profile;
  const authUser = detail.authUser;
  const sub = (profile?.subscriptions ?? [])[0];
  const balance = creditBalance?.available ?? 0;
  const isSuspended = (detail.entitlements ?? []).some((e: any) => e.access === 'deny' && !e.course_id);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Perfil</p>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
              {(profile?.full_name ?? authUser?.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{profile?.full_name ?? '—'}</p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">{authUser?.email ?? '—'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">{profile?.role ?? 'member'}</span>
                {isSuspended && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/15 text-red-500">Suspenso</span>}
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--text-tertiary)] space-y-1 pt-1 border-t border-[var(--border-hairline)]">
            <div className="flex justify-between"><span>Cadastro</span><span className="text-[var(--text-secondary)]">{formatDate(authUser?.created_at ?? profile?.created_at)}</span></div>
          </div>
        </div>

        {/* Auth info card */}
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Acesso</p>
          <div className="text-xs space-y-2">
            <div className="flex justify-between items-start gap-2"><span className="text-[var(--text-tertiary)] shrink-0">Ultimo acesso</span><span className="text-[var(--text-secondary)] text-right">{authUser?.last_sign_in_at ? timeAgo(authUser.last_sign_in_at) : '—'}</span></div>
            <div className="flex justify-between items-start gap-2"><span className="text-[var(--text-tertiary)] shrink-0">Email verificado</span><span className={cn('text-right', authUser?.email_confirmed_at ? 'text-emerald-500' : 'text-red-500')}>{authUser?.email_confirmed_at ? formatDate(authUser.email_confirmed_at) : 'Nao verificado'}</span></div>
            <div className="flex justify-between items-start gap-2"><span className="text-[var(--text-tertiary)] shrink-0">Saldo de creditos</span><span className={cn('font-semibold', balance < 0 ? 'text-red-500' : 'text-[var(--text-primary)]')}>{balance.toLocaleString('pt-BR')} cr</span></div>
          </div>
        </div>

        {/* Plan card */}
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Plano</p>
          {sub ? (
            <div className="text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--text-primary)]">{(sub as any).plans?.name ?? 'Plano'}</span>
                <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded', (sub as any).status === 'active' ? 'bg-emerald-500/15 text-emerald-500' : (sub as any).status === 'past_due' ? 'bg-amber-500/15 text-amber-500' : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]')}>{(sub as any).status}</span>
              </div>
              <div className="flex justify-between text-[var(--text-tertiary)]"><span>Renova em</span><span>{formatDate((sub as any).current_period_end)}</span></div>
              {(sub as any).plans?.credits_per_month && <div className="flex justify-between text-[var(--text-tertiary)]"><span>Creditos/mes</span><span>{(sub as any).plans.credits_per_month}</span></div>}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-tertiary)]">Sem plano ativo</p>
          )}
        </div>

        {/* Actions card */}
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Acoes</p>
          <div className="space-y-2">
            <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => { setNewRole(profile?.role === 'admin' ? 'member' : 'admin'); setShowRoleModal(true); }}>
              Alterar role<span className="ml-auto text-[10px] text-[var(--text-tertiary)]">atual: {profile?.role ?? 'member'}</span>
            </Button>
            <Button size="sm" variant="ghost" className="w-full justify-start text-red-500 hover:text-red-400" onClick={() => suspendMutation.mutate()} disabled={suspendMutation.isPending || isSuspended}>
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
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Novo role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'member' | 'admin')} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]">
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => roleMutation.mutate(newRole)} disabled={roleMutation.isPending}>{roleMutation.isPending ? 'Salvando...' : 'Confirmar'}</Button>
            <Button variant="ghost" onClick={() => setShowRoleModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
