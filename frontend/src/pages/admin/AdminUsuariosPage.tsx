import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import {
  adminGetUsers,
  adminGetUser,
  adminGrantEntitlement,
  adminRevokeEntitlement,
} from '../../api/courses.ts';

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ACCESS_LABELS: Record<string, string> = {
  allow: 'Permitido',
  deny: 'Bloqueado',
  full_access: 'Acesso Total',
};

const ACCESS_VARIANT: Record<string, string> = {
  allow: 'text-[var(--color-text-primary)] bg-[var(--color-bg-active)]',
  full_access: 'text-[var(--color-text-primary)] bg-[var(--color-bg-active)]',
  deny: 'text-[var(--color-text-tertiary)] bg-[var(--color-bg-elevated)] opacity-60',
};

export function AdminUsuariosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({
    course_id: '',
    access: 'allow' as 'allow' | 'deny' | 'full_access',
    reason: '',
    expires_at: '',
  });

  const debouncedSearch = useDebounce(search);
  const limit = 20;
  const offset = page * limit;

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, offset],
    queryFn: () => adminGetUsers({ q: debouncedSearch || undefined, limit, offset }),
  });

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-user', selectedUserId],
    queryFn: () => adminGetUser(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const grantMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminGrantEntitlement>[1]) =>
      adminGrantEntitlement(selectedUserId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', selectedUserId] });
      setShowGrantModal(false);
      setGrantForm({ course_id: '', access: 'allow', reason: '', expires_at: '' });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (entitlementId: string) =>
      adminRevokeEntitlement(selectedUserId!, entitlementId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', selectedUserId] });
    },
  });

  const users = (usersData as any)?.users ?? [];
  const total = (usersData as any)?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const detail = userDetail as any;

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-5xl mx-auto space-y-6"
      >
        <motion.div variants={staggerItem} className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)]">Usuários</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Gerencie acessos, entitlements e matrículas.
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={staggerItem}>
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </motion.div>

        {/* User list */}
        <motion.div variants={staggerItem} className="space-y-1">
          {usersLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
            ))
          ) : users.length === 0 ? (
            <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
              <p className="text-sm text-[var(--text-tertiary)]">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            users.map((user: any) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border text-left transition-colors',
                  selectedUserId === user.id
                    ? 'bg-[var(--bg-surface-1)] border-[var(--border-strong)]'
                    : 'bg-[var(--bg-surface-1)] border-[var(--border-hairline)] hover:border-[var(--border-default)]',
                )}
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
                  {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {user.full_name ?? '—'}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {user.role === 'admin' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                      Admin
                    </span>
                  )}
                  <svg className="h-4 w-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div variants={staggerItem} className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-tertiary)]">
              {offset + 1}–{Math.min(offset + limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Próximo
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* User detail drawer */}
      <Modal
        open={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        className="sm:max-w-xl"
      >
        {detailLoading || !detail ? (
          <div className="p-6 space-y-3 animate-pulse">
            <div className="h-5 w-48 rounded bg-[var(--bg-surface-1)]" />
            <div className="h-4 w-32 rounded bg-[var(--bg-surface-1)]" />
            <div className="h-24 rounded bg-[var(--bg-surface-1)]" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
                {(detail.profile?.full_name ?? detail.profile?.email ?? '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {detail.profile?.full_name ?? '—'}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)]">{detail.profile?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                    {detail.profile?.role ?? 'member'}
                  </span>
                  {detail.profile?.plan && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Plano: {detail.profile.plan}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setShowGrantModal(true)}
              >
                + Entitlement
              </Button>
            </div>

            {/* Entitlements */}
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Entitlements ({(detail.entitlements ?? []).length})
              </h3>
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
                        <div className="flex items-center gap-2 mt-0.5">
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
                            <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[120px]">
                              {ent.reason}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => revokeMutation.mutate(ent.id)}
                        disabled={revokeMutation.isPending}
                        className="shrink-0 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors px-1 py-1"
                      >
                        Revogar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enrollments */}
            {(detail.enrollments ?? []).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  Matrículas ({(detail.enrollments ?? []).length})
                </h3>
                <div className="space-y-1">
                  {(detail.enrollments as any[]).map((enr: any) => (
                    <div
                      key={enr.id}
                      className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
                    >
                      <p className="text-xs text-[var(--text-primary)] truncate">
                        {enr.courses?.title ?? enr.course_id}
                      </p>
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 ml-2">
                        {formatDate(enr.enrolled_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Grant entitlement modal */}
      <Modal
        open={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        className="sm:max-w-sm"
      >
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
              placeholder="Ex: Bonus acesso, parceria..."
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
              onClick={() => grantMutation.mutate({
                course_id: grantForm.course_id || undefined,
                access: grantForm.access,
                reason: grantForm.reason || undefined,
                expires_at: grantForm.expires_at || null,
              })}
              disabled={grantMutation.isPending}
              className="flex-1"
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
