import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { adminGetTurmaEnrollments, adminGetUsers, type Turma } from '../../../../api/courses.ts';

interface Props { turma: Turma; isAdding: boolean; isRemoving: boolean; confirmRemoveId: string | null;
  onClose: () => void; onAdd: (userId: string) => void;
  onConfirmRemove: (id: string) => void; onCancelRemove: () => void; onRemove: (id: string) => void; }

export function ManageTurmaStudentsModal({ turma, isAdding, isRemoving, confirmRemoveId,
  onClose, onAdd, onConfirmRemove, onCancelRemove, onRemove }: Props) {
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data: enrollData, isLoading } = useQuery({ queryKey: ['admin-turma-enrollments', turma.id], queryFn: () => adminGetTurmaEnrollments(turma.id) });
  const { data: usersData } = useQuery({ queryKey: ['admin-users-search', userSearch], queryFn: () => adminGetUsers({ q: userSearch, limit: 20 }), enabled: userSearch.length >= 2 });

  const enrollments = (enrollData as any)?.enrollments ?? [];
  const users = (usersData as any)?.users ?? [];

  return (
    <Modal open onClose={onClose} className="sm:max-w-md">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Alunos — {turma.name}</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{enrollments.length} aluno{enrollments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="space-y-2 border-b border-[var(--border-hairline)] pb-4">
          <p className="text-xs font-medium text-[var(--text-secondary)]">Adicionar aluno</p>
          <Input label="" value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setSelectedUserId(''); }} placeholder="Buscar por email ou nome (2+ chars)..." />
          {userSearch.length >= 2 && users.length > 0 && !selectedUserId && (
            <div className="rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] max-h-32 overflow-y-auto">
              {users.map((u: any) => (
                <button key={u.id} onClick={() => { setSelectedUserId(u.id); setUserSearch(u.email ?? u.full_name ?? u.id); }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-hairline)] last:border-0">
                  <p className="text-xs font-medium text-[var(--text-primary)]">{u.email ?? '—'}</p>
                  {u.full_name && <p className="text-[10px] text-[var(--text-tertiary)]">{u.full_name}</p>}
                </button>
              ))}
            </div>
          )}
          <Button size="sm" onClick={() => { if (selectedUserId) { onAdd(selectedUserId); setUserSearch(''); setSelectedUserId(''); } }} disabled={!selectedUserId || isAdding}>
            {isAdding ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading ? ([1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-[var(--bg-surface-1)]" />))
            : enrollments.length === 0 ? <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">Nenhum aluno nesta turma.</p>
            : enrollments.map((enr: any) => (
              <div key={enr.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{enr.profiles?.full_name ?? enr.profiles?.email ?? 'Usuário'}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{enr.profiles?.email ?? enr.user_id?.slice(0, 8) + '…'}</p>
                </div>
                {confirmRemoveId === enr.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onRemove(enr.id)} disabled={isRemoving} className="text-[10px] text-red-500 hover:text-red-400 transition-colors">Confirmar</button>
                    <button onClick={onCancelRemove} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">Não</button>
                  </div>
                ) : (
                  <button onClick={() => onConfirmRemove(enr.id)} className="text-[10px] text-[var(--text-tertiary)] hover:text-red-500 transition-colors shrink-0">Remover</button>
                )}
              </div>
            ))}
        </div>
        <Button variant="ghost" className="w-full" onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  );
}
