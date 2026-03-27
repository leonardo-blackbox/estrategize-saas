import { motion } from 'framer-motion';
import { staggerContainer } from '../../../../lib/motion.ts';
import { useAdminHome } from '../../hooks/useAdminHome.ts';
import { AdminHomeSettings } from '../AdminHomeSettings/index.ts';
import { AdminHomeSections } from '../AdminHomeSections/index.ts';
import { AdminHomeCreateSectionModal } from '../AdminHomeCreateSectionModal/index.ts';
import { AdminHomeDeleteSectionModal } from '../AdminHomeDeleteSectionModal/index.ts';
import { AdminHomeManageCoursesModal } from '../AdminHomeManageCoursesModal/index.ts';

export function AdminHomePage() {
  const h = useAdminHome();

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-3xl mx-auto space-y-10"
    >
      <AdminHomeSettings
        title={h.title}
        setTitle={h.setTitle}
        subtitle={h.subtitle}
        setSubtitle={h.setSubtitle}
        settingsLoading={h.settingsLoading}
        saveMutation={h.saveMutation}
        saved={h.saved}
        previewTitle={h.previewTitle}
        previewSubtitle={h.previewSubtitle}
      />

      <hr className="border-[var(--border-hairline)]" />

      <AdminHomeSections
        sectionList={h.sectionList}
        sectionsLoading={h.sectionsLoading}
        editingId={h.editingId}
        editTitle={h.editTitle}
        setEditTitle={h.setEditTitle}
        setEditingId={h.setEditingId}
        openStatusDropdown={h.openStatusDropdown}
        setOpenStatusDropdown={h.setOpenStatusDropdown}
        updateMutation={h.updateMutation}
        reorderPending={h.reorderMutation.isPending}
        moveSection={h.moveSection}
        onCreateClick={() => h.setShowCreateModal(true)}
        onManageSection={h.setManagingSection}
        onDeleteSection={h.setConfirmDelete}
      />

      <AdminHomeCreateSectionModal
        open={h.showCreateModal}
        onClose={() => { h.setShowCreateModal(false); h.setNewSectionTitle(''); }}
        title={h.newSectionTitle}
        setTitle={h.setNewSectionTitle}
        onCreate={(t) => h.createMutation.mutate(t)}
        isPending={h.createMutation.isPending}
      />

      <AdminHomeDeleteSectionModal
        open={!!h.confirmDelete}
        onClose={() => h.setConfirmDelete(null)}
        onConfirm={() => { if (h.confirmDelete) h.deleteMutation.mutate(h.confirmDelete); }}
        isPending={h.deleteMutation.isPending}
      />

      {h.managingSection && (
        <AdminHomeManageCoursesModal
          key={h.managingSection.id + '-' + (h.managingSection.formation_section_courses?.length ?? 0)}
          section={h.managingSection}
          onClose={() => h.setManagingSection(null)}
          onSaved={() => { h.invalidateSections(); h.setManagingSection(null); }}
        />
      )}
    </motion.div>
  );
}
