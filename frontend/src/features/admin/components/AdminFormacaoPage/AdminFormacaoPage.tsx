import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Modal } from '../../../../components/ui/Modal.tsx';
import {
  adminGetFormacaoSections, adminCreateSection, adminUpdateSection,
  adminDeleteSection, adminReorderSections, adminListCourses, adminUpdateSectionCourses,
} from '../../../../api/courses.ts';
import { SectionCard } from './SectionCard.tsx';
import { ManageSectionCoursesModal } from './ManageSectionCoursesModal.tsx';

export function AdminFormacaoPage() {
  const qc = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [managingSection, setManagingSection] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['admin-formacao-sections'],
    queryFn: adminGetFormacaoSections,
  });
  const sectionList = sections as any[];

  const { data: allCoursesData } = useQuery({ queryKey: ['admin-courses'], queryFn: adminListCourses });
  const allCourses = Array.isArray(allCoursesData) ? allCoursesData : [];

  const invalidateSections = () => qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] });

  const createMutation = useMutation({
    mutationFn: (title: string) => adminCreateSection({ title, sort_order: sectionList.length }),
    onSuccess: () => { invalidateSections(); setShowCreateModal(false); setNewTitle(''); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminUpdateSection(id, data),
    onSuccess: () => { invalidateSections(); setEditingId(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteSection(id, true),
    onSuccess: () => { invalidateSections(); setConfirmDelete(null); },
  });
  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) => adminReorderSections(items),
    onSuccess: invalidateSections,
  });
  const saveCoursesMutation = useMutation({
    mutationFn: ({ sectionId, courseIds }: { sectionId: string; courseIds: string[] }) =>
      adminUpdateSectionCourses(sectionId, courseIds.map((course_id, idx) => ({ course_id, sort_order: idx }))),
    onSuccess: () => { invalidateSections(); setManagingSection(null); },
  });

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const list = [...sectionList];
    const t = direction === 'up' ? index - 1 : index + 1;
    if (t < 0 || t >= list.length) return;
    [list[index], list[t]] = [list[t], list[index]];
    reorderMutation.mutate(list.map((s, i) => ({ id: s.id, sort_order: i })));
  };

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Seções</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Organize as seções exibidas na área de membros.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>+ Nova seção</Button>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />)
        ) : sectionList.length === 0 ? (
          <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhuma seção criada ainda.</p>
          </div>
        ) : (
          sectionList.map((section: any, index: number) => (
            <SectionCard
              key={section.id} section={section} index={index} totalCount={sectionList.length}
              editingId={editingId} editTitle={editTitle} openStatusDropdown={openStatusDropdown}
              isReorderPending={reorderMutation.isPending} isUpdatePending={updateMutation.isPending}
              onEditTitleChange={setEditTitle}
              onEditSave={(id, title) => updateMutation.mutate({ id, data: { title } })}
              onEditCancel={() => setEditingId(null)}
              onEditStart={(id, title) => { setEditingId(id); setEditTitle(title); }}
              onMoveUp={(i) => moveSection(i, 'up')}
              onMoveDown={(i) => moveSection(i, 'down')}
              onStatusToggle={(id) => setOpenStatusDropdown((prev) => prev === id ? null : id)}
              onStatusSelect={(id, active) => { updateMutation.mutate({ id, data: { is_active: active } }); setOpenStatusDropdown(null); }}
              onStatusClickOutside={() => setOpenStatusDropdown(null)}
              onManageCourses={setManagingSection}
              onDelete={setConfirmDelete}
            />
          ))
        )}
      </motion.div>

      <Modal open={showCreateModal} onClose={() => { setShowCreateModal(false); setNewTitle(''); }} className="sm:max-w-xs">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Nova seção</h2>
          <Input label="Nome da seção" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: Bônus, Masterclasses..."
            onKeyDown={(e) => { if (e.key === 'Enter' && newTitle.trim()) createMutation.mutate(newTitle.trim()); }} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => { if (newTitle.trim()) createMutation.mutate(newTitle.trim()); }}
              disabled={!newTitle.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); setNewTitle(''); }}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} className="sm:max-w-xs">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Excluir seção?</h2>
          <p className="text-sm text-[var(--text-tertiary)]">Os cursos não serão deletados, apenas removidos desta seção.</p>
          <div className="flex gap-2">
            <Button className="flex-1 bg-red-500 hover:bg-red-400"
              onClick={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete); }} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {managingSection && (
        <ManageSectionCoursesModal
          key={managingSection.id + '-' + (managingSection.formation_section_courses?.length ?? 0)}
          section={managingSection} allCourses={allCourses} isSaving={saveCoursesMutation.isPending}
          onClose={() => setManagingSection(null)}
          onSave={(courseIds) => saveCoursesMutation.mutate({ sectionId: managingSection.id, courseIds })}
        />
      )}
    </motion.div>
  );
}
