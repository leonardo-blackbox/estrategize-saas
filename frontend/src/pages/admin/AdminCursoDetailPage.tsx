import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  adminGetCourse,
  adminUpdateCourse,
  adminCreateModule,
  adminUpdateModule,
  adminDeleteModule,
  adminCreateLesson,
  adminUpdateLesson,
  adminDeleteLesson,
  adminUpdateCourseSales,
  type LessonLink,
} from '../../api/courses.ts';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { CourseCoverUpload } from '../../components/admin/CourseCoverUpload.tsx';
import { CourseBannerUpload } from '../../components/admin/CourseBannerUpload.tsx';
import { LessonLinksModal } from '../../components/admin/LessonLinksModal.tsx';
import { cn } from '../../lib/cn.ts';

// ─── SalesTab ─────────────────────────────────────────────────
function SalesTab({ course, courseId }: { course: any; courseId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    sales_url: (course.sales_url as string) ?? '',
    offer_badge_enabled: (course.offer_badge_enabled as boolean) ?? false,
    offer_badge_text: (course.offer_badge_text as string) ?? 'Oferta',
  });
  const [error, setError] = useState('');

  // Sync form when course data refetches after save
  useEffect(() => {
    setForm({
      sales_url: (course.sales_url as string) ?? '',
      offer_badge_enabled: (course.offer_badge_enabled as boolean) ?? false,
      offer_badge_text: (course.offer_badge_text as string) ?? 'Oferta',
    });
  }, [course.sales_url, course.offer_badge_enabled, course.offer_badge_text]);

  const saveMutation = useMutation({
    mutationFn: () => adminUpdateCourseSales(courseId, {
      sales_url: form.sales_url || null,
      offer_badge_enabled: form.offer_badge_enabled,
      offer_badge_text: form.offer_badge_text || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', courseId] });
      setError('');
    },
    onError: (e: any) => setError((e as Error).message ?? 'Erro ao salvar'),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-4">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Página de vendas
        </p>
        <Input
          label="URL da página de vendas"
          type="url"
          value={form.sales_url}
          onChange={(e) => setForm((f) => ({ ...f, sales_url: e.target.value }))}
          placeholder="https://checkout.exemplo.com/curso"
        />
        <p className="text-xs text-[var(--text-tertiary)] -mt-2">
          Quando configurado, membros sem acesso verão um botão "Comprar" no card do curso.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-4">
        <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Selo de oferta
        </p>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Ativar selo</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Exibe um badge de destaque no card do curso.
            </p>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, offer_badge_enabled: !f.offer_badge_enabled }))}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
              form.offer_badge_enabled ? 'bg-[var(--text-primary)]' : 'bg-[var(--bg-hover)]',
            )}
          >
            <span className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-[var(--bg-base)] shadow transition-transform duration-200',
              form.offer_badge_enabled ? 'translate-x-6' : 'translate-x-1',
            )} />
          </button>
        </label>

        {form.offer_badge_enabled && (
          <div className="space-y-3">
            <Input
              label="Texto do selo (máx. 30 chars)"
              value={form.offer_badge_text}
              onChange={(e) => setForm((f) => ({ ...f, offer_badge_text: e.target.value.slice(0, 30) }))}
              placeholder="Oferta"
            />
            {/* Preview */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-tertiary)]">Preview:</span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--border-default)]">
                {form.offer_badge_text || 'Oferta'}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? 'Salvando...' : 'Salvar configurações'}
      </Button>
    </div>
  );
}

const emptyModule = { title: '', description: '', drip_days: '' };
const emptyLesson = {
  title: '', description: '', video_url: '', duration_secs: '', drip_days: '', is_free_preview: false,
};

export function AdminCursoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<'content' | 'sales'>('content');

  // Modal open states
  const [editingCourse, setEditingCourse] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [confirmDeleteModule, setConfirmDeleteModule] = useState<string | null>(null);
  const [showLessonModal, setShowLessonModal] = useState<string | null>(null); // moduleId for create
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<string | null>(null);
  const [linksLesson, setLinksLesson] = useState<{ id: string; title: string; links: LessonLink[] } | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  // Forms
  const [courseForm, setCourseForm] = useState({ title: '', description: '', cover_url: '', banner_url: '' });
  const [moduleForm, setModuleForm] = useState(emptyModule);
  const [editModuleForm, setEditModuleForm] = useState(emptyModule);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editLessonForm, setEditLessonForm] = useState(emptyLesson);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-course', id],
    queryFn: () => adminGetCourse(id!),
    enabled: !!id,
  });

  const course = data as any;

  const invalidateCourse = () => {
    qc.invalidateQueries({ queryKey: ['admin-course', id] });
    qc.invalidateQueries({ queryKey: ['admin-courses'] });
  };

  const updateCourseMutation = useMutation({
    mutationFn: (d: any) => adminUpdateCourse(id!, d),
    onSuccess: () => { invalidateCourse(); setEditingCourse(false); },
  });

  const createModuleMutation = useMutation({
    mutationFn: (d: any) => adminCreateModule(id!, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setShowModuleModal(false);
      setModuleForm(emptyModule);
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ mid, d }: { mid: string; d: any }) => adminUpdateModule(mid, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setEditingModule(null);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: adminDeleteModule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setConfirmDeleteModule(null);
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: ({ moduleId, d }: { moduleId: string; d: any }) => adminCreateLesson(moduleId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setShowLessonModal(null);
      setLessonForm(emptyLesson);
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ lid, d }: { lid: string; d: any }) => adminUpdateLesson(lid, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setEditingLesson(null);
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: adminDeleteLesson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', id] });
      setConfirmDeleteLesson(null);
    },
  });

  const openEditCourse = () => {
    setCourseForm({
      title: course?.title ?? '',
      description: course?.description ?? '',
      cover_url: course?.cover_url ?? '',
      banner_url: course?.banner_url ?? '',
    });
    setEditingCourse(true);
  };

  const openEditModule = (mod: any) => {
    setEditingModule(mod);
    setEditModuleForm({ title: mod.title, description: mod.description ?? '', drip_days: mod.drip_days?.toString() ?? '0' });
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setEditLessonForm({
      title: lesson.title,
      description: lesson.description ?? '',
      video_url: lesson.video_url ?? '',
      duration_secs: lesson.duration_secs?.toString() ?? '',
      drip_days: lesson.drip_days?.toString() ?? '0',
      is_free_preview: lesson.is_free_preview ?? false,
    });
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
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
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

        {/* Tabs */}
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-1 border-b border-[var(--border-hairline)]">
            {(['content', 'sales'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab
                    ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
                )}
              >
                {tab === 'content' ? 'Conteúdo' : 'Vendas'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sales Tab */}
        {activeTab === 'sales' && course && (
          <motion.div variants={staggerItem}>
            <SalesTab course={course} courseId={id!} />
          </motion.div>
        )}

        {/* Modules */}
        {activeTab === 'content' && (
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
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => toggleModule(mod.id)} className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[11px] font-bold text-[var(--text-tertiary)]">
                        {mi + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{mod.title}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          {(mod.lessons ?? []).length} aulas
                          {mod.drip_days > 0 && ` · drip ${mod.drip_days}d`}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModule(mod)}
                        className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-2 py-1 transition-colors"
                        title="Editar módulo"
                      >
                        ✏️
                      </button>
                      {confirmDeleteModule === mod.id ? (
                        <>
                          <button
                            onClick={() => deleteModuleMutation.mutate(mod.id)}
                            disabled={deleteModuleMutation.isPending}
                            className="text-[11px] text-red-500 px-2 py-1"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteModule(null)}
                            className="text-[11px] text-[var(--text-tertiary)] px-2 py-1"
                          >
                            Não
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteModule(mod.id)}
                          className="text-[11px] text-[var(--text-tertiary)] hover:text-red-500 px-2 py-1 transition-colors"
                          title="Deletar módulo"
                        >
                          🗑
                        </button>
                      )}
                      <svg
                        onClick={() => toggleModule(mod.id)}
                        className={cn('h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 cursor-pointer', isOpen && 'rotate-180')}
                        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

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
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                              {lesson.drip_days > 0 && (
                                <span className="text-[10px] text-[var(--text-tertiary)]">drip {lesson.drip_days}d</span>
                              )}
                              {(lesson.lesson_links ?? []).length > 0 && (
                                <span className="text-[10px] text-[var(--text-tertiary)]">{lesson.lesson_links.length} link(s)</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setLinksLesson({ id: lesson.id, title: lesson.title, links: lesson.lesson_links ?? [] })}
                              className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-1.5 py-1 transition-colors"
                              title="Gerenciar links"
                            >
                              🔗
                            </button>
                            <button
                              onClick={() => openEditLesson(lesson)}
                              className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-1.5 py-1 transition-colors"
                              title="Editar aula"
                            >
                              ✏️
                            </button>
                            {confirmDeleteLesson === lesson.id ? (
                              <>
                                <button
                                  onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                  disabled={deleteLessonMutation.isPending}
                                  className="text-[10px] text-red-500 px-1.5 py-1"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteLesson(null)}
                                  className="text-[10px] text-[var(--text-tertiary)] px-1.5 py-1"
                                >
                                  Não
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteLesson(lesson.id)}
                                className="text-[10px] text-[var(--text-tertiary)] hover:text-red-500 px-1.5 py-1 transition-colors"
                                title="Deletar aula"
                              >
                                🗑
                              </button>
                            )}
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
        )}
      </motion.div>

      {/* ─── MODALS ─────────────────────────────────────────── */}

      {/* Edit course */}
      <Modal open={editingCourse} onClose={() => setEditingCourse(false)} className="sm:max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Editar curso</h2>
          <div className="space-y-3">
            <Input label="Título *" value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Descrição</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
              />
            </div>
            <CourseCoverUpload
              courseId={id!}
              currentUrl={courseForm.cover_url}
              onUploaded={(url) => setCourseForm((f) => ({ ...f, cover_url: url }))}
            />
            <CourseBannerUpload
              courseId={id!}
              currentUrl={courseForm.banner_url}
              onUploaded={(url) => setCourseForm((f) => ({ ...f, banner_url: url }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => updateCourseMutation.mutate({
                title: courseForm.title,
                description: courseForm.description || undefined,
                cover_url: courseForm.cover_url || undefined,
                banner_url: courseForm.banner_url || undefined,
              })}
              disabled={!courseForm.title.trim() || updateCourseMutation.isPending}
              className="flex-1"
            >
              {updateCourseMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => setEditingCourse(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Create module */}
      <Modal open={showModuleModal} onClose={() => setShowModuleModal(false)} className="sm:max-w-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Novo módulo</h2>
          <div className="space-y-3">
            <Input label="Título *" value={moduleForm.title} onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Módulo 1: Introdução" />
            <Input label="Descrição" value={moduleForm.description} onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))} />
            <Input label="Drip (dias)" type="number" value={moduleForm.drip_days} onChange={(e) => setModuleForm((f) => ({ ...f, drip_days: e.target.value }))} placeholder="0" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => createModuleMutation.mutate({
                title: moduleForm.title,
                description: moduleForm.description || undefined,
                drip_days: moduleForm.drip_days ? parseInt(moduleForm.drip_days) : undefined,
              })}
              disabled={!moduleForm.title.trim() || createModuleMutation.isPending}
              className="flex-1"
            >
              {createModuleMutation.isPending ? 'Criando...' : 'Criar módulo'}
            </Button>
            <Button variant="ghost" onClick={() => setShowModuleModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit module */}
      <Modal open={!!editingModule} onClose={() => setEditingModule(null)} className="sm:max-w-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Editar módulo</h2>
          <div className="space-y-3">
            <Input label="Título *" value={editModuleForm.title} onChange={(e) => setEditModuleForm((f) => ({ ...f, title: e.target.value }))} />
            <Input label="Descrição" value={editModuleForm.description} onChange={(e) => setEditModuleForm((f) => ({ ...f, description: e.target.value }))} />
            <Input label="Drip (dias)" type="number" value={editModuleForm.drip_days} onChange={(e) => setEditModuleForm((f) => ({ ...f, drip_days: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => editingModule && updateModuleMutation.mutate({
                mid: editingModule.id,
                d: {
                  title: editModuleForm.title,
                  description: editModuleForm.description || undefined,
                  drip_days: editModuleForm.drip_days ? parseInt(editModuleForm.drip_days) : 0,
                },
              })}
              disabled={!editModuleForm.title.trim() || updateModuleMutation.isPending}
              className="flex-1"
            >
              {updateModuleMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => setEditingModule(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Create lesson */}
      <Modal open={!!showLessonModal} onClose={() => setShowLessonModal(null)} className="sm:max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Nova aula</h2>
          <div className="space-y-3">
            <Input label="Título *" value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Aula 1: Boas-vindas" />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Descrição</label>
              <textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
              />
            </div>
            <Input label="URL do vídeo" value={lessonForm.video_url} onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Duração (seg)" type="number" value={lessonForm.duration_secs} onChange={(e) => setLessonForm((f) => ({ ...f, duration_secs: e.target.value }))} placeholder="600" />
              <Input label="Drip (dias)" type="number" value={lessonForm.drip_days} onChange={(e) => setLessonForm((f) => ({ ...f, drip_days: e.target.value }))} placeholder="0" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={lessonForm.is_free_preview} onChange={(e) => setLessonForm((f) => ({ ...f, is_free_preview: e.target.checked }))} className="rounded border-[var(--border-hairline)]" />
              <span className="text-xs text-[var(--text-secondary)]">Preview gratuito</span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => showLessonModal && createLessonMutation.mutate({
                moduleId: showLessonModal,
                d: {
                  title: lessonForm.title,
                  description: lessonForm.description || undefined,
                  video_url: lessonForm.video_url || undefined,
                  duration_secs: lessonForm.duration_secs ? parseInt(lessonForm.duration_secs) : undefined,
                  drip_days: lessonForm.drip_days ? parseInt(lessonForm.drip_days) : 0,
                  is_free_preview: lessonForm.is_free_preview,
                },
              })}
              disabled={!lessonForm.title.trim() || createLessonMutation.isPending}
              className="flex-1"
            >
              {createLessonMutation.isPending ? 'Criando...' : 'Criar aula'}
            </Button>
            <Button variant="ghost" onClick={() => setShowLessonModal(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit lesson */}
      <Modal open={!!editingLesson} onClose={() => setEditingLesson(null)} className="sm:max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Editar aula</h2>
          <div className="space-y-3">
            <Input label="Título *" value={editLessonForm.title} onChange={(e) => setEditLessonForm((f) => ({ ...f, title: e.target.value }))} />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Descrição</label>
              <textarea
                value={editLessonForm.description}
                onChange={(e) => setEditLessonForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
              />
            </div>
            <Input label="URL do vídeo" value={editLessonForm.video_url} onChange={(e) => setEditLessonForm((f) => ({ ...f, video_url: e.target.value }))} placeholder="https://..." />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Duração (seg)" type="number" value={editLessonForm.duration_secs} onChange={(e) => setEditLessonForm((f) => ({ ...f, duration_secs: e.target.value }))} />
              <Input label="Drip (dias)" type="number" value={editLessonForm.drip_days} onChange={(e) => setEditLessonForm((f) => ({ ...f, drip_days: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editLessonForm.is_free_preview} onChange={(e) => setEditLessonForm((f) => ({ ...f, is_free_preview: e.target.checked }))} className="rounded border-[var(--border-hairline)]" />
              <span className="text-xs text-[var(--text-secondary)]">Preview gratuito</span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => editingLesson && updateLessonMutation.mutate({
                lid: editingLesson.id,
                d: {
                  title: editLessonForm.title,
                  description: editLessonForm.description || undefined,
                  video_url: editLessonForm.video_url || undefined,
                  duration_secs: editLessonForm.duration_secs ? parseInt(editLessonForm.duration_secs) : undefined,
                  drip_days: editLessonForm.drip_days ? parseInt(editLessonForm.drip_days) : 0,
                  is_free_preview: editLessonForm.is_free_preview,
                },
              })}
              disabled={!editLessonForm.title.trim() || updateLessonMutation.isPending}
              className="flex-1"
            >
              {updateLessonMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="ghost" onClick={() => setEditingLesson(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Lesson links modal */}
      {linksLesson && (
        <LessonLinksModal
          lessonId={linksLesson.id}
          lessonTitle={linksLesson.title}
          courseId={id!}
          links={linksLesson.links}
          onClose={() => setLinksLesson(null)}
        />
      )}
    </>
  );
}
