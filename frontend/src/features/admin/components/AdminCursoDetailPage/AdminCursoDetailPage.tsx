import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { useAdminCursoDetail } from '../../hooks/useAdminCursoDetail.ts';
import { AdminCursoDetailHeader } from '../AdminCursoDetailHeader/index.ts';
import { AdminCursoDetailTabs } from '../AdminCursoDetailTabs/index.ts';
import { AdminCursoDetailSalesTab } from '../AdminCursoDetailSalesTab/index.ts';
import { AdminCursoDetailModules } from '../AdminCursoDetailModules/index.ts';
import { AdminCursoDetailModals } from '../AdminCursoDetailModals/index.ts';

export function AdminCursoDetailPage() {
  const c = useAdminCursoDetail();

  if (c.isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-[var(--bg-surface-1)]" />
        <div className="h-32 rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
        ))}
      </div>
    );
  }

  if (c.isError || !c.course) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">Curso nao encontrado.</p>
        <Link to="/admin/cursos" className="mt-3 inline-block text-xs text-[var(--text-secondary)] underline">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-4xl mx-auto space-y-6"
      >
        <AdminCursoDetailHeader course={c.course} onEditClick={c.openEditCourse} />
        <AdminCursoDetailTabs activeTab={c.activeTab} setActiveTab={c.setActiveTab} />

        {c.activeTab === 'sales' && c.course && (
          <motion.div variants={staggerItem}>
            <AdminCursoDetailSalesTab course={c.course} courseId={c.id!} />
          </motion.div>
        )}

        {c.activeTab === 'content' && (
          <AdminCursoDetailModules
            modules={c.course.modules ?? []}
            openModules={c.openModules}
            toggleModule={c.toggleModule}
            confirmDeleteModule={c.confirmDeleteModule}
            setConfirmDeleteModule={c.setConfirmDeleteModule}
            deleteModuleMutation={c.deleteModuleMutation}
            onEditModule={c.openEditModule}
            onCreateModule={() => c.setShowModuleModal(true)}
            confirmDeleteLesson={c.confirmDeleteLesson}
            setConfirmDeleteLesson={c.setConfirmDeleteLesson}
            deleteLessonMutation={c.deleteLessonMutation}
            onEditLesson={c.openEditLesson}
            onLinksLesson={c.setLinksLesson}
            onAddLesson={(moduleId) => c.setShowLessonModal(moduleId)}
          />
        )}
      </motion.div>

      <AdminCursoDetailModals
        courseId={c.id!}
        editingCourse={c.editingCourse}
        setEditingCourse={c.setEditingCourse}
        courseForm={c.courseForm}
        setCourseForm={c.setCourseForm}
        updateCourseMutation={c.updateCourseMutation}
        showModuleModal={c.showModuleModal}
        setShowModuleModal={c.setShowModuleModal}
        moduleForm={c.moduleForm}
        setModuleForm={c.setModuleForm}
        createModuleMutation={c.createModuleMutation}
        editingModule={c.editingModule}
        setEditingModule={c.setEditingModule}
        editModuleForm={c.editModuleForm}
        setEditModuleForm={c.setEditModuleForm}
        updateModuleMutation={c.updateModuleMutation}
        showLessonModal={c.showLessonModal}
        setShowLessonModal={c.setShowLessonModal}
        lessonForm={c.lessonForm}
        setLessonForm={c.setLessonForm}
        createLessonMutation={c.createLessonMutation}
        editingLesson={c.editingLesson}
        setEditingLesson={c.setEditingLesson}
        editLessonForm={c.editLessonForm}
        setEditLessonForm={c.setEditLessonForm}
        updateLessonMutation={c.updateLessonMutation}
        linksLesson={c.linksLesson}
        setLinksLesson={c.setLinksLesson}
      />
    </>
  );
}
