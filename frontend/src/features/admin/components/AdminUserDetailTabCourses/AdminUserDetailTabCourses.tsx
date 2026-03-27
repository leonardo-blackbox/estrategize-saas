import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../lib/cn.ts';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import {
  adminGrantEntitlement,
  adminRevokeEntitlement,
  adminGetUserProgress,
} from '../../services/admin.api.ts';
import { formatDate, ACCESS_LABELS, ACCESS_VARIANT } from '../../helpers/format.ts';

interface TabCoursesProps {
  detail: any;
  userId: string;
}

export function AdminUserDetailTabCourses({ detail, userId }: TabCoursesProps) {
  const qc = useQueryClient();
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({
    course_id: '', access: 'allow' as 'allow' | 'deny' | 'full_access', reason: '', expires_at: '',
  });

  const grantMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminGrantEntitlement>[1]) => adminGrantEntitlement(userId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-user', userId] }); setShowGrantModal(false); setGrantForm({ course_id: '', access: 'allow', reason: '', expires_at: '' }); },
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
            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Entitlements ({(detail.entitlements ?? []).length})</h3>
            <Button size="sm" onClick={() => setShowGrantModal(true)}>+ Entitlement</Button>
          </div>
          {(detail.entitlements ?? []).length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">Sem entitlements.</p>
          ) : (
            <div className="space-y-2">
              {(detail.entitlements as any[]).map((ent: any) => (
                <div key={ent.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{ent.courses?.title ?? 'Acesso global'}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={cn('text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded', ACCESS_VARIANT[ent.access] ?? ACCESS_VARIANT.allow)}>{ACCESS_LABELS[ent.access] ?? ent.access}</span>
                      {ent.expires_at && <span className="text-[10px] text-[var(--text-tertiary)]">Expira {formatDate(ent.expires_at)}</span>}
                      {ent.reason && <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[140px]">{ent.reason}</span>}
                    </div>
                  </div>
                  <button onClick={() => revokeMutation.mutate(ent.id)} disabled={revokeMutation.isPending} className="shrink-0 text-[10px] text-[var(--text-tertiary)] hover:text-red-500 transition-colors">Revogar</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrollments */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Matriculas ({(detail.enrollments ?? []).length})</h3>
          {(detail.enrollments ?? []).length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">Sem matriculas.</p>
          ) : (
            <div className="space-y-2">
              {(detail.enrollments as any[]).map((enr: any) => {
                const prog = progress.find((p: any) => p.course_id === enr.course_id);
                return (
                  <div key={enr.id} className="rounded-[var(--radius-sm)] px-3 py-2.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{enr.courses?.title ?? enr.course_id}</p>
                      <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">{formatDate(enr.enrolled_at)}</span>
                    </div>
                    {prog && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]"><span>Progresso</span><span>{prog.completed_lessons}/{prog.total_lessons} aulas</span></div>
                        <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                          <div className="h-full bg-[var(--text-primary)] rounded-full" style={{ width: prog.total_lessons > 0 ? `${Math.round((prog.completed_lessons / prog.total_lessons) * 100)}%` : '0%' }} />
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
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Conceder Entitlement</h2>
          <div className="space-y-3">
            <Input label="ID do Curso (vazio = acesso global)" value={grantForm.course_id} onChange={(e) => setGrantForm((f) => ({ ...f, course_id: e.target.value }))} placeholder="uuid do curso..." />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Tipo de acesso</label>
              <select value={grantForm.access} onChange={(e) => setGrantForm((f) => ({ ...f, access: e.target.value as any }))} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]">
                <option value="allow">Permitido</option>
                <option value="full_access">Acesso Total (ignora drip)</option>
                <option value="deny">Bloqueado</option>
              </select>
            </div>
            <Input label="Motivo (opcional)" value={grantForm.reason} onChange={(e) => setGrantForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Ex: Bonus, parceria..." />
            <Input label="Expira em (opcional)" type="date" value={grantForm.expires_at} onChange={(e) => setGrantForm((f) => ({ ...f, expires_at: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" onClick={() => grantMutation.mutate({ course_id: grantForm.course_id || undefined, access: grantForm.access, reason: grantForm.reason || undefined, expires_at: grantForm.expires_at || null })} disabled={grantMutation.isPending}>{grantMutation.isPending ? 'Salvando...' : 'Conceder'}</Button>
            <Button variant="ghost" onClick={() => setShowGrantModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
