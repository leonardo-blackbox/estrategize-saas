import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import {
  adminGetTurmas,
  adminCreateTurma,
  adminUpdateTurma,
  adminDeleteTurma,
  adminGetTurmaEnrollments,
  adminAddTurmaEnrollment,
  adminRemoveTurmaEnrollment,
  adminGetCourses,
  adminGetUsers,
  type Turma,
} from '../../api/courses.ts';

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AdminTurmasPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [managingTurma, setManagingTurma] = useState<Turma | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: turmasData, isLoading } = useQuery({
    queryKey: ['admin-turmas'],
    queryFn: adminGetTurmas,
  });

  const { data: coursesData } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: adminGetCourses,
  });

  const turmas = (turmasData as any)?.turmas ?? [];
  const courses = (coursesData as any[]) ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteTurma(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-turmas'] });
      setConfirmDeleteId(null);
    },
  });

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-5"
    >
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Turmas</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Gerencie as turmas de cada curso e defina as regras de liberação de conteúdo.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + Nova turma
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
          ))
        ) : turmas.length === 0 ? (
          <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhuma turma criada ainda.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Crie uma turma para gerenciar o acesso dos alunos.</p>
          </div>
        ) : (
          turmas.map((turma: Turma) => (
            <div
              key={turma.id}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-[var(--radius-md)] border',
                'bg-[var(--bg-surface-1)] border-[var(--border-hairline)]',
                turma.status === 'archived' && 'opacity-50',
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{turma.name}</p>
                  {turma.status === 'archived' && (
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)]">
                      Arquivada
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {(turma as any).courses?.title ?? 'Curso'} &middot;{' '}
                  {turma.drip_type === 'enrollment_date' ? 'Libera a partir da matrícula' : `Libera em ${formatDate(turma.access_start_date)}`}{' '}
                  &middot; {turma.enrollment_count ?? 0} aluno{(turma.enrollment_count ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setManagingTurma(turma)}>
                  Alunos
                </Button>
                <button
                  onClick={() => setEditingTurma(turma)}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Editar
                </button>
                {confirmDeleteId === turma.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteMutation.mutate(turma.id)}
                      disabled={deleteMutation.isPending}
                      className="text-[10px] text-red-500 hover:text-red-400 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(turma.id)}
                    className="text-xs text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                  >
                    Arquivar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </motion.div>

      {/* Create Modal */}
      {showCreate && (
        <TurmaFormModal
          courses={courses}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin-turmas'] });
            setShowCreate(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {editingTurma && (
        <TurmaFormModal
          turma={editingTurma}
          courses={courses}
          onClose={() => setEditingTurma(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin-turmas'] });
            setEditingTurma(null);
          }}
        />
      )}

      {/* Manage students modal */}
      {managingTurma && (
        <ManageTurmaStudentsModal
          turma={managingTurma}
          onClose={() => setManagingTurma(null)}
        />
      )}
    </motion.div>
  );
}

// ─── TurmaFormModal ─────────────────────────────────────────────
function TurmaFormModal({
  turma,
  courses,
  onClose,
  onSaved,
}: {
  turma?: Turma;
  courses: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    course_id: turma?.course_id ?? '',
    name: turma?.name ?? '',
    description: turma?.description ?? '',
    drip_type: (turma?.drip_type ?? 'enrollment_date') as 'enrollment_date' | 'fixed_date',
    access_start_date: turma?.access_start_date ? turma.access_start_date.slice(0, 10) : '',
  });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => adminCreateTurma({
      course_id: form.course_id,
      name: form.name,
      description: form.description || undefined,
      drip_type: form.drip_type,
      access_start_date: form.drip_type === 'fixed_date' && form.access_start_date
        ? new Date(form.access_start_date).toISOString()
        : null,
    }),
    onSuccess: onSaved,
    onError: (e: any) => setError((e as Error).message),
  });

  const updateMutation = useMutation({
    mutationFn: () => adminUpdateTurma(turma!.id, {
      name: form.name,
      description: form.description || null,
      drip_type: form.drip_type,
      access_start_date: form.drip_type === 'fixed_date' && form.access_start_date
        ? new Date(form.access_start_date).toISOString()
        : null,
    }),
    onSuccess: onSaved,
    onError: (e: any) => setError((e as Error).message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!form.course_id || !form.name.trim()) {
      setError('Curso e nome são obrigatórios.');
      return;
    }
    if (turma) updateMutation.mutate();
    else createMutation.mutate();
  };

  return (
    <Modal open onClose={onClose} className="sm:max-w-sm">
      <div className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {turma ? 'Editar turma' : 'Nova turma'}
        </h2>

        {!turma && (
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Curso</label>
            <select
              value={form.course_id}
              onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
              className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
            >
              <option value="">Selecionar curso...</option>
              {courses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Nome da turma"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex: Turma Janeiro 2025"
        />

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Regra de liberação</label>
          <select
            value={form.drip_type}
            onChange={(e) => setForm((f) => ({ ...f, drip_type: e.target.value as 'enrollment_date' | 'fixed_date' }))}
            className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
          >
            <option value="enrollment_date">A partir da data de matrícula</option>
            <option value="fixed_date">A partir de uma data fixa</option>
          </select>
        </div>

        {form.drip_type === 'fixed_date' && (
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Data de início</label>
            <input
              type="date"
              value={form.access_start_date}
              onChange={(e) => setForm((f) => ({ ...f, access_start_date: e.target.value }))}
              className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Salvando...' : (turma ? 'Salvar' : 'Criar turma')}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── ManageTurmaStudentsModal ────────────────────────────────────
function ManageTurmaStudentsModal({
  turma,
  onClose,
}: {
  turma: Turma;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');

  const { data: enrollData, isLoading } = useQuery({
    queryKey: ['admin-turma-enrollments', turma.id],
    queryFn: () => adminGetTurmaEnrollments(turma.id),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-search', userSearch],
    queryFn: () => adminGetUsers({ q: userSearch, limit: 20 }),
    enabled: userSearch.length >= 2,
  });

  const enrollments = (enrollData as any)?.enrollments ?? [];
  const users = (usersData as any)?.users ?? [];

  const addMutation = useMutation({
    mutationFn: () => adminAddTurmaEnrollment(turma.id, { user_id: selectedUserId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-turma-enrollments', turma.id] });
      qc.invalidateQueries({ queryKey: ['admin-turmas'] });
      setUserSearch('');
      setSelectedUserId('');
      setAddError('');
    },
    onError: (e: any) => setAddError((e as Error).message),
  });

  const removeMutation = useMutation({
    mutationFn: (enrollmentId: string) => adminRemoveTurmaEnrollment(turma.id, enrollmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-turma-enrollments', turma.id] });
      qc.invalidateQueries({ queryKey: ['admin-turmas'] });
      setConfirmRemoveId(null);
    },
  });

  return (
    <Modal open onClose={onClose} className="sm:max-w-md">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Alunos — {turma.name}</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{enrollments.length} aluno{enrollments.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Add student */}
        <div className="space-y-2 border-b border-[var(--border-hairline)] pb-4">
          <p className="text-xs font-medium text-[var(--text-secondary)]">Adicionar aluno</p>
          <Input
            label=""
            value={userSearch}
            onChange={(e) => { setUserSearch(e.target.value); setSelectedUserId(''); setAddError(''); }}
            placeholder="Buscar por email ou nome (2+ chars)..."
          />
          {userSearch.length >= 2 && users.length > 0 && !selectedUserId && (
            <div className="rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] max-h-32 overflow-y-auto">
              {users.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUserId(u.id); setUserSearch(u.email ?? u.full_name ?? u.id); }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-hairline)] last:border-0"
                >
                  <p className="text-xs font-medium text-[var(--text-primary)]">{u.email ?? '—'}</p>
                  {u.full_name && <p className="text-[10px] text-[var(--text-tertiary)]">{u.full_name}</p>}
                </button>
              ))}
            </div>
          )}
          {addError && <p className="text-[11px] text-red-500">{addError}</p>}
          <Button
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={!selectedUserId || addMutation.isPending}
          >
            {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </div>

        {/* Students list */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-[var(--bg-surface-1)]" />)
          ) : enrollments.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">Nenhum aluno nesta turma.</p>
          ) : (
            enrollments.map((enr: any) => (
              <div key={enr.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {enr.profiles?.full_name ?? enr.profiles?.email ?? 'Usuário'}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {enr.profiles?.email ?? enr.user_id?.slice(0, 8) + '…'}
                  </p>
                </div>
                {confirmRemoveId === enr.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => removeMutation.mutate(enr.id)}
                      disabled={removeMutation.isPending}
                      className="text-[10px] text-red-500 hover:text-red-400 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmRemoveId(null)}
                      className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemoveId(enr.id)}
                    className="text-[10px] text-[var(--text-tertiary)] hover:text-red-500 transition-colors shrink-0"
                  >
                    Remover
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <Button variant="ghost" className="w-full" onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  );
}
