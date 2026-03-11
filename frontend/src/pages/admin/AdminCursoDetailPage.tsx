import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  adminGetCourse,
  adminUpdateCourse,
  adminCreateModule,
  adminCreateLesson,
} from '../../api/courses.ts';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { cn } from '../../lib/cn.ts';

export function AdminCursoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState<string | null>(null); // moduleId
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', cover_url: '' });
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({
    title: '', description: '', video_url: '', duration_secs: '', is_free_preview: false,
  });
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-course', id],
    queryFn: () => adminGetCourse(id!),
    enabled: !!id,
  });

  const updateCourseMutation = useMutation({
    mutationFn: (d: Parameters<typeof adminUpdateCourse>[1]) => adminUpdateCourse(id!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      setEditingCourse(false);
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: (d: Parameters<typeof adminCreateModule>[1]) => adminCreateModule(id!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setShowModuleModal(false);
      setModuleForm({ title: '', description: '' });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: ({ moduleId, data: d }: { moduleId: string; data: Parameters<typeof adminCreateLesson>[1] }) =>
      adminCreateLesson(moduleId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setShowLessonModal(null);
      setLessonForm({ title: '', description: '', video_url: '', duration_secs: '', is_free_preview: false });
    },
  });

  const course = data as any;

  const openEditCourse = () => {
    setCourseForm({
      title: course?.title ?? '',
      description: course?.description ?? '',
      cover_url: course?.cover_url ?? '',
    });
    setEditingCourse(true);
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (isLoading) {
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

  if (isError || !course) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">Curso não encontrado.</p>
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
        {/* Breadcrumb */}
        <motion.div variants={staggerItem} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Link to="/admin/cursos" className="hover:text-[var(--text-secondary)] transition-colors">
            Cursos
          </Link>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-[var(--text-secondary)] truncate">{course.title}</span>
        </motion.div>

        {/* Course info card */}
        <motion.div
          variants={staggerItem}
          className="rounded-[var(--radius-md)] p-5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
        >
          <div className="flex items-start gap-4">
            {course.cover_url ? (
              <img
                src={course.cover_url}
                alt={course.title}
                className="w-20 h-20 rounded-[var(--radius-sm)] object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-[var(--radius-sm)] bg-[var(--bg-hover)] shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-base font-semibold text-[var(--text-primary)]">{course.title}</h1>
                  {course.description && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                      course.status === 'published' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' :
                      course.status === 'archived' ? 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]' :
                      'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
                    )}>
                      {course.status}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {(course.modules ?? []).length} módulos
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={openEditCourse}>
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modules */}
        <motion.div variants={staggerItem} className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Módulos ({(course.modules ?? []).length})
            </h2>
            <Button size="sm" onClick={() => setShowModuleModal(true)}>
              + Módulo
            </Button>
          </div>

          {(course.modules as any[] ?? []).length === 0 ? (
            <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
              <p className="text-xs text-[var(--text-tertiary)]">Nenhum módulo criado ainda.</p>
            </div>
          ) : (
            (course.modules as any[]).map((mod: any, mi: number) => {
              const isOpen = openModules.has(mod.id);
              return (
                <div
                  key={mod.id}
                  className="rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[11px] font-bold text-[var(--text-tertiary)]">
                      {mi + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{mod.title}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        {(mod.lessons ?? []).length} aulas
                      </p>
                    </div>
                    <svg
                      className={cn('h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200', isOpen && 'rotate-180')}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[var(--border-hairline)]">
                      {(mod.lessons as any[] ?? []).map((lesson: any, li: number) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-hairline)] last:border-0"
                        >
                          <span className="shrink-0 text-[11px] font-medium text-[var(--text-tertiary)] w-5 text-center">
                            {li + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lesson.video_url && (
                                <span className="text-[10px] text-[var(--text-tertiary)]">Vídeo</span>
                              )}
                              {lesson.is_free_preview && (
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Preview</span>
                              )}
                              {lesson.duration_secs && (
                                <span className="text-[10px] text-[var(--text-tertiary)]">
                                  {Math.floor(lesson.duration_secs / 60)}min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="px-4 py-2.5">
                        <button
                          onClick={() => setShowLessonModal(mod.id)}
                          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          + Adicionar aula
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </motion.div>
      </motion.div>

      {/* Edit course modal */}
      <Modal open={editingCourse} onClose={() => setEditingCourse(false)} className="sm:max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Editar curso</h2>
          <div className="space-y-3">
            <Input
              label="Título *"
              value={courseForm.title}
              onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))}
            />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Descrição
              </label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
              />
            </div>
            <Input
              label="URL da capa"
              value={courseForm.cover_url}
              onChange={(e) => setCourseForm((f) => ({ ...f, cover_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => updateCourseMutation.mutate({
                title: courseForm.title,
                description: courseForm.description || undefined,
                cover_url: courseForm.cover_url || undefined,
              })}
              disabled={!courseForm.title.trim() || updateCourseMutation.isPending}
              className="flex-1"
            >
              {updateCourseMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => setEditingCourse(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create module modal */}
      <Modal open={showModuleModal} onClose={() => setShowModuleModal(false)} className="sm:max-w-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Novo módulo</h2>
          <div className="space-y-3">
            <Input
              label="Título *"
              value={moduleForm.title}
              onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Módulo 1: Introdução"
            />
            <Input
              label="Descrição"
              value={moduleForm.description}
              onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => createModuleMutation.mutate({ title: moduleForm.title, description: moduleForm.description || undefined })}
              disabled={!moduleForm.title.trim() || createModuleMutation.isPending}
              className="flex-1"
            >
              {createModuleMutation.isPending ? 'Criando...' : 'Criar módulo'}
            </Button>
            <Button variant="ghost" onClick={() => setShowModuleModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create lesson modal */}
      <Modal open={!!showLessonModal} onClose={() => setShowLessonModal(null)} className="sm:max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Nova aula</h2>
          <div className="space-y-3">
            <Input
              label="Título *"
              value={lessonForm.title}
              onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Aula 1: Boas-vindas"
            />
            <Input
              label="URL do vídeo"
              value={lessonForm.video_url}
              onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
            />
            <Input
              label="Duração (segundos)"
              type="number"
              value={lessonForm.duration_secs}
              onChange={(e) => setLessonForm((f) => ({ ...f, duration_secs: e.target.value }))}
              placeholder="Ex: 600"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lessonForm.is_free_preview}
                onChange={(e) => setLessonForm((f) => ({ ...f, is_free_preview: e.target.checked }))}
                className="rounded border-[var(--border-hairline)]"
              />
              <span className="text-xs text-[var(--text-secondary)]">Preview gratuito</span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => showLessonModal && createLessonMutation.mutate({
                moduleId: showLessonModal,
                data: {
                  title: lessonForm.title,
                  video_url: lessonForm.video_url || undefined,
                  duration_secs: lessonForm.duration_secs ? parseInt(lessonForm.duration_secs) : undefined,
                  is_free_preview: lessonForm.is_free_preview,
                },
              })}
              disabled={!lessonForm.title.trim() || createLessonMutation.isPending}
              className="flex-1"
            >
              {createLessonMutation.isPending ? 'Criando...' : 'Criar aula'}
            </Button>
            <Button variant="ghost" onClick={() => setShowLessonModal(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
