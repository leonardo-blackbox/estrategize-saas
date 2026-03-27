import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { CourseCoverUpload } from '../../../../components/admin/CourseCoverUpload.tsx';
import { CourseBannerUpload } from '../../../../components/admin/CourseBannerUpload.tsx';
import { LessonLinksModal } from '../../../../components/admin/LessonLinksModal.tsx';
import type { LessonLink } from '../../services/admin.api.ts';

interface CourseForm {
  title: string;
  description: string;
  cover_url: string;
  banner_url: string;
}

interface ModuleForm {
  title: string;
  description: string;
  drip_days: string;
}

interface LessonForm {
  title: string;
  description: string;
  video_url: string;
  duration_secs: string;
  drip_days: string;
  is_free_preview: boolean;
}

interface AdminCursoDetailModalsProps {
  courseId: string;
  // Edit course
  editingCourse: boolean;
  setEditingCourse: (v: boolean) => void;
  courseForm: CourseForm;
  setCourseForm: (fn: (f: CourseForm) => CourseForm) => void;
  updateCourseMutation: { mutate: (d: any) => void; isPending: boolean };
  // Create module
  showModuleModal: boolean;
  setShowModuleModal: (v: boolean) => void;
  moduleForm: ModuleForm;
  setModuleForm: (fn: (f: ModuleForm) => ModuleForm) => void;
  createModuleMutation: { mutate: (d: any) => void; isPending: boolean };
  // Edit module
  editingModule: any | null;
  setEditingModule: (v: any) => void;
  editModuleForm: ModuleForm;
  setEditModuleForm: (fn: (f: ModuleForm) => ModuleForm) => void;
  updateModuleMutation: { mutate: (d: any) => void; isPending: boolean };
  // Create lesson
  showLessonModal: string | null;
  setShowLessonModal: (v: string | null) => void;
  lessonForm: LessonForm;
  setLessonForm: (fn: (f: LessonForm) => LessonForm) => void;
  createLessonMutation: { mutate: (d: any) => void; isPending: boolean };
  // Edit lesson
  editingLesson: any | null;
  setEditingLesson: (v: any) => void;
  editLessonForm: LessonForm;
  setEditLessonForm: (fn: (f: LessonForm) => LessonForm) => void;
  updateLessonMutation: { mutate: (d: any) => void; isPending: boolean };
  // Lesson links
  linksLesson: { id: string; title: string; links: LessonLink[] } | null;
  setLinksLesson: (v: null) => void;
}

export function AdminCursoDetailModals(p: AdminCursoDetailModalsProps) {
  return (
    <>
      {/* Edit course */}
      <Modal open={p.editingCourse} onClose={() => p.setEditingCourse(false)} className="sm:max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Editar curso</h2>
          <div className="space-y-3">
            <Input label="Titulo *" value={p.courseForm.title} onChange={(e) => p.setCourseForm((f) => ({ ...f, title: e.target.value }))} />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Descricao</label>
              <textarea value={p.courseForm.description} onChange={(e) => p.setCourseForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]" />
            </div>
            <CourseCoverUpload courseId={p.courseId} currentUrl={p.courseForm.cover_url} onUploaded={(url) => p.setCourseForm((f) => ({ ...f, cover_url: url }))} />
            <CourseBannerUpload courseId={p.courseId} currentUrl={p.courseForm.banner_url} onUploaded={(url) => p.setCourseForm((f) => ({ ...f, banner_url: url }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={() => p.updateCourseMutation.mutate({ title: p.courseForm.title, description: p.courseForm.description || undefined, cover_url: p.courseForm.cover_url || undefined, banner_url: p.courseForm.banner_url || undefined })} disabled={!p.courseForm.title.trim() || p.updateCourseMutation.isPending} className="flex-1">
              {p.updateCourseMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => p.setEditingCourse(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Create module */}
      <Modal open={p.showModuleModal} onClose={() => p.setShowModuleModal(false)} className="sm:max-w-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Novo modulo</h2>
          <div className="space-y-3">
            <Input label="Titulo *" value={p.moduleForm.title} onChange={(e) => p.setModuleForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Modulo 1: Introducao" />
            <Input label="Descricao" value={p.moduleForm.description} onChange={(e) => p.setModuleForm((f) => ({ ...f, description: e.target.value }))} />
            <Input label="Drip (dias)" type="number" value={p.moduleForm.drip_days} onChange={(e) => p.setModuleForm((f) => ({ ...f, drip_days: e.target.value }))} placeholder="0" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={() => p.createModuleMutation.mutate({ title: p.moduleForm.title, description: p.moduleForm.description || undefined, drip_days: p.moduleForm.drip_days ? parseInt(p.moduleForm.drip_days) : undefined })} disabled={!p.moduleForm.title.trim() || p.createModuleMutation.isPending} className="flex-1">
              {p.createModuleMutation.isPending ? 'Criando...' : 'Criar modulo'}
            </Button>
            <Button variant="ghost" onClick={() => p.setShowModuleModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit module */}
      <Modal open={!!p.editingModule} onClose={() => p.setEditingModule(null)} className="sm:max-w-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Editar modulo</h2>
          <div className="space-y-3">
            <Input label="Titulo *" value={p.editModuleForm.title} onChange={(e) => p.setEditModuleForm((f) => ({ ...f, title: e.target.value }))} />
            <Input label="Descricao" value={p.editModuleForm.description} onChange={(e) => p.setEditModuleForm((f) => ({ ...f, description: e.target.value }))} />
            <Input label="Drip (dias)" type="number" value={p.editModuleForm.drip_days} onChange={(e) => p.setEditModuleForm((f) => ({ ...f, drip_days: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={() => p.editingModule && p.updateModuleMutation.mutate({ mid: p.editingModule.id, d: { title: p.editModuleForm.title, description: p.editModuleForm.description || undefined, drip_days: p.editModuleForm.drip_days ? parseInt(p.editModuleForm.drip_days) : 0 } })} disabled={!p.editModuleForm.title.trim() || p.updateModuleMutation.isPending} className="flex-1">
              {p.updateModuleMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => p.setEditingModule(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Create lesson */}
      <Modal open={!!p.showLessonModal} onClose={() => p.setShowLessonModal(null)} className="sm:max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Nova aula</h2>
          <div className="space-y-3">
            <Input label="Titulo *" value={p.lessonForm.title} onChange={(e) => p.setLessonForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Aula 1: Boas-vindas" />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Descricao</label>
              <textarea value={p.lessonForm.description} onChange={(e) => p.setLessonForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]" />
            </div>
            <Input label="URL do video" value={p.lessonForm.video_url} onChange={(e) => p.setLessonForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Duracao (seg)" type="number" value={p.lessonForm.duration_secs} onChange={(e) => p.setLessonForm((f) => ({ ...f, duration_secs: e.target.value }))} placeholder="600" />
              <Input label="Drip (dias)" type="number" value={p.lessonForm.drip_days} onChange={(e) => p.setLessonForm((f) => ({ ...f, drip_days: e.target.value }))} placeholder="0" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={p.lessonForm.is_free_preview} onChange={(e) => p.setLessonForm((f) => ({ ...f, is_free_preview: e.target.checked }))} className="rounded border-[var(--border-hairline)]" />
              <span className="text-xs text-[var(--text-secondary)]">Preview gratuito</span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={() => p.showLessonModal && p.createLessonMutation.mutate({ moduleId: p.showLessonModal, d: { title: p.lessonForm.title, description: p.lessonForm.description || undefined, video_url: p.lessonForm.video_url || undefined, duration_secs: p.lessonForm.duration_secs ? parseInt(p.lessonForm.duration_secs) : undefined, drip_days: p.lessonForm.drip_days ? parseInt(p.lessonForm.drip_days) : 0, is_free_preview: p.lessonForm.is_free_preview } })} disabled={!p.lessonForm.title.trim() || p.createLessonMutation.isPending} className="flex-1">
              {p.createLessonMutation.isPending ? 'Criando...' : 'Criar aula'}
            </Button>
            <Button variant="ghost" onClick={() => p.setShowLessonModal(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit lesson */}
      <Modal open={!!p.editingLesson} onClose={() => p.setEditingLesson(null)} className="sm:max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Editar aula</h2>
          <div className="space-y-3">
            <Input label="Titulo *" value={p.editLessonForm.title} onChange={(e) => p.setEditLessonForm((f) => ({ ...f, title: e.target.value }))} />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Descricao</label>
              <textarea value={p.editLessonForm.description} onChange={(e) => p.setEditLessonForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]" />
            </div>
            <Input label="URL do video" value={p.editLessonForm.video_url} onChange={(e) => p.setEditLessonForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://..." />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Duracao (seg)" type="number" value={p.editLessonForm.duration_secs} onChange={(e) => p.setEditLessonForm((f) => ({ ...f, duration_secs: e.target.value }))} />
              <Input label="Drip (dias)" type="number" value={p.editLessonForm.drip_days} onChange={(e) => p.setEditLessonForm((f) => ({ ...f, drip_days: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={p.editLessonForm.is_free_preview} onChange={(e) => p.setEditLessonForm((f) => ({ ...f, is_free_preview: e.target.checked }))} className="rounded border-[var(--border-hairline)]" />
              <span className="text-xs text-[var(--text-secondary)]">Preview gratuito</span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={() => p.editingLesson && p.updateLessonMutation.mutate({ lid: p.editingLesson.id, d: { title: p.editLessonForm.title, description: p.editLessonForm.description || undefined, video_url: p.editLessonForm.video_url || undefined, duration_secs: p.editLessonForm.duration_secs ? parseInt(p.editLessonForm.duration_secs) : undefined, drip_days: p.editLessonForm.drip_days ? parseInt(p.editLessonForm.drip_days) : 0, is_free_preview: p.editLessonForm.is_free_preview } })} disabled={!p.editLessonForm.title.trim() || p.updateLessonMutation.isPending} className="flex-1">
              {p.updateLessonMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => p.setEditingLesson(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Lesson links modal */}
      {p.linksLesson && (
        <LessonLinksModal
          lessonId={p.linksLesson.id}
          lessonTitle={p.linksLesson.title}
          courseId={p.courseId}
          links={p.linksLesson.links}
          onClose={() => p.setLinksLesson(null)}
        />
      )}
    </>
  );
}
