import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import {
  adminGetOfertas, adminCreateOferta, adminUpdateOferta, adminDeleteOferta,
  adminUpdateOfertaTurmas, adminGetTurmas, type Oferta, type Turma,
} from '../../../../api/courses.ts';
import { OfertaCard } from './OfertaCard.tsx';
import { OfertaFormModal, type OfertaFormData } from './OfertaFormModal.tsx';
import { ManageOfertaTurmasModal } from './ManageOfertaTurmasModal.tsx';

export function AdminOfertasPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingOferta, setEditingOferta] = useState<Oferta | null>(null);
  const [managingOferta, setManagingOferta] = useState<Oferta | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: ofertasData, isLoading } = useQuery({ queryKey: ['admin-ofertas'], queryFn: adminGetOfertas });
  const { data: turmasData } = useQuery({ queryKey: ['admin-turmas'], queryFn: adminGetTurmas });
  const ofertas = ((ofertasData as any)?.ofertas ?? []) as Oferta[];
  const activeTurmas = (((turmasData as any)?.turmas ?? []) as Turma[]).filter((t) => t.status === 'active');

  const invalidateOfertas = () => qc.invalidateQueries({ queryKey: ['admin-ofertas'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteOferta(id),
    onSuccess: () => { invalidateOfertas(); setConfirmDeleteId(null); },
  });
  const createMutation = useMutation({
    mutationFn: (data: OfertaFormData) => adminCreateOferta({
      name: data.name, type: data.type, price_display: data.price_display || undefined,
    }),
    onSuccess: () => { invalidateOfertas(); setShowCreate(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OfertaFormData }) =>
      adminUpdateOferta(id, { name: data.name, type: data.type, price_display: data.price_display || null }),
    onSuccess: () => { invalidateOfertas(); setEditingOferta(null); },
  });
  const saveTurmasMutation = useMutation({
    mutationFn: ({ id, turmaIds }: { id: string; turmaIds: string[] }) =>
      adminUpdateOfertaTurmas(id, turmaIds),
    onSuccess: () => { invalidateOfertas(); setManagingOferta(null); },
  });

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-5xl mx-auto space-y-6">
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Ofertas</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Gerencie as ofertas de acesso e selecione as turmas incluídas em cada uma.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Nova Oferta</Button>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />)
        ) : ofertas.length === 0 ? (
          <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhuma oferta criada ainda.</p>
          </div>
        ) : (
          ofertas.map((oferta) => (
            <OfertaCard key={oferta.id} oferta={oferta} confirmDeleteId={confirmDeleteId}
              isDeletePending={deleteMutation.isPending}
              onEdit={setEditingOferta} onManageTurmas={setManagingOferta}
              onConfirmDelete={setConfirmDeleteId} onCancelDelete={() => setConfirmDeleteId(null)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </motion.div>

      {showCreate && (
        <OfertaFormModal isSaving={createMutation.isPending} onClose={() => setShowCreate(false)}
          onSubmit={(data) => createMutation.mutate(data)} />
      )}
      {editingOferta && (
        <OfertaFormModal oferta={editingOferta} isSaving={updateMutation.isPending}
          onClose={() => setEditingOferta(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editingOferta.id, data })} />
      )}
      {managingOferta && (
        <ManageOfertaTurmasModal key={managingOferta.id} oferta={managingOferta}
          activeTurmas={activeTurmas} isSaving={saveTurmasMutation.isPending}
          onClose={() => setManagingOferta(null)}
          onSave={(turmaIds) => saveTurmasMutation.mutate({ id: managingOferta.id, turmaIds })}
        />
      )}
    </motion.div>
  );
}
