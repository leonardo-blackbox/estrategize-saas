import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import {
  adminGetTurmas, adminCreateTurma, adminUpdateTurma, adminDeleteTurma,
  adminGetTurmaEnrollments, adminAddTurmaEnrollment, adminRemoveTurmaEnrollment,
  adminGetCourses, type Turma,
} from '../../../../api/courses.ts';
import { TurmaCard } from './TurmaCard.tsx';
import { TurmaFormModal, type TurmaFormData } from './TurmaFormModal.tsx';
import { ManageTurmaStudentsModal } from './ManageTurmaStudentsModal.tsx';

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
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const { data: turmasData, isLoading } = useQuery({ queryKey: ['admin-turmas'], queryFn: adminGetTurmas });
  const { data: coursesData } = useQuery({ queryKey: ['admin-courses'], queryFn: adminGetCourses });
  const turmas = (turmasData as any)?.turmas ?? [];
  const courses = (coursesData as any[]) ?? [];

  const invalidateTurmas = () => qc.invalidateQueries({ queryKey: ['admin-turmas'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteTurma(id),
    onSuccess: () => { invalidateTurmas(); setConfirmDeleteId(null); },
  });
  const createMutation = useMutation({
    mutationFn: (data: TurmaFormData) => adminCreateTurma({
      course_id: data.course_id, name: data.name,
      description: data.description || undefined, drip_type: data.drip_type,
      access_start_date: data.drip_type === 'fixed_date' && data.access_start_date
        ? new Date(data.access_start_date).toISOString() : null,
    }),
    onSuccess: () => { invalidateTurmas(); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TurmaFormData }) => adminUpdateTurma(id, {
      name: data.name, description: data.description || null, drip_type: data.drip_type,
      access_start_date: data.drip_type === 'fixed_date' && data.access_start_date
        ? new Date(data.access_start_date).toISOString() : null,
    }),
    onSuccess: () => { invalidateTurmas(); setEditingTurma(null); },
  });
  const addMutation = useMutation({
    mutationFn: ({ turmaId, userId }: { turmaId: string; userId: string }) =>
      adminAddTurmaEnrollment(turmaId, { user_id: userId }),
    onSuccess: (_, { turmaId }) => {
      qc.invalidateQueries({ queryKey: ['admin-turma-enrollments', turmaId] });
      invalidateTurmas();
    },
  });
  const removeMutation = useMutation({
    mutationFn: ({ turmaId, enrollmentId }: { turmaId: string; enrollmentId: string }) =>
      adminRemoveTurmaEnrollment(turmaId, enrollmentId),
    onSuccess: (_, { turmaId }) => {
      qc.invalidateQueries({ queryKey: ['admin-turma-enrollments', turmaId] });
      invalidateTurmas();
      setConfirmRemoveId(null);
    },
  });

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-5xl mx-auto space-y-5">
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Turmas</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Gerencie as turmas de cada curso e defina as regras de liberação de conteúdo.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Nova turma</Button>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />)
        ) : turmas.length === 0 ? (
          <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhuma turma criada ainda.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Crie uma turma para gerenciar o acesso dos alunos.</p>
          </div>
        ) : (
          turmas.map((turma: Turma) => (
            <TurmaCard key={turma.id} turma={turma} confirmDeleteId={confirmDeleteId}
              isDeletePending={deleteMutation.isPending} formatDate={formatDate}
              onEdit={setEditingTurma} onManageStudents={setManagingTurma}
              onConfirmDelete={setConfirmDeleteId} onCancelDelete={() => setConfirmDeleteId(null)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </motion.div>

      {showCreate && (
        <TurmaFormModal courses={courses} isSaving={createMutation.isPending}
          onClose={() => setShowCreate(false)} onSubmit={(data) => createMutation.mutate(data)} />
      )}
      {editingTurma && (
        <TurmaFormModal turma={editingTurma} courses={courses} isSaving={updateMutation.isPending}
          onClose={() => setEditingTurma(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editingTurma.id, data })} />
      )}
      {managingTurma && (
        <ManageTurmaStudentsModal turma={managingTurma} isAdding={addMutation.isPending}
          isRemoving={removeMutation.isPending} confirmRemoveId={confirmRemoveId}
          onClose={() => setManagingTurma(null)}
          onAdd={(userId) => addMutation.mutate({ turmaId: managingTurma.id, userId })}
          onConfirmRemove={setConfirmRemoveId} onCancelRemove={() => setConfirmRemoveId(null)}
          onRemove={(enrollmentId) => removeMutation.mutate({ turmaId: managingTurma.id, enrollmentId })}
        />
      )}
    </motion.div>
  );
}
