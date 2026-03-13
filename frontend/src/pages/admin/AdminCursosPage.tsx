import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  adminGetCourses,
  adminCreateCourse,
  adminPublishCourse,
  adminArchiveCourse,
} from '../../api/courses.ts';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { CourseCoverUpload } from '../../components/admin/CourseCoverUpload.tsx';
import { CourseBannerUpload } from '../../components/admin/CourseBannerUpload.tsx';

interface CourseFormData {
  title: string;
  description: string;
  cover_url: string;
  banner_url: string;
}

const initialForm: CourseFormData = { title: '', description: '', cover_url: '', banner_url: '' };

const statusVariant: Record<string, 'success' | 'locked' | 'default'> = {
  published: 'success',
  draft: 'default',
  archived: 'locked',
};

const statusLabel: Record<string, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  archived: 'Arquivado',
};

export function AdminCursosPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CourseFormData>(initialForm);
  // Stable temp ID used as the upload path before the course is created
  const pendingIdRef = useRef<string>(crypto.randomUUID());

  const openCreate = () => {
    pendingIdRef.current = crypto.randomUUID();
    setForm(initialForm);
    setShowCreate(true);
  };

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: adminGetCourses,
  });

  const createMutation = useMutation({
    mutationFn: adminCreateCourse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
      setShowCreate(false);
      setForm(initialForm);
    },
  });

  const publishMutation = useMutation({
    mutationFn: adminPublishCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }),
  });

  const archiveMutation = useMutation({
    mutationFn: adminArchiveCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-courses'] }),
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      cover_url: form.cover_url || undefined,
      banner_url: form.banner_url || undefined,
    });
  };

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-5xl mx-auto space-y-6"
      >
        <motion.div variants={staggerItem} className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)]">Conteúdo</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Gerencie cursos, módulos e aulas.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            + Novo curso
          </Button>
        </motion.div>

        {isLoading ? (
          <motion.div variants={staggerItem} className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
            ))}
          </motion.div>
        ) : (courses as any[]).length === 0 ? (
          <motion.div
            variants={staggerItem}
            className="rounded-[var(--radius-md)] p-12 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center"
          >
            <p className="text-sm text-[var(--text-tertiary)]">Nenhum curso criado ainda.</p>
            <Button size="sm" className="mt-4" onClick={openCreate}>
              Criar primeiro curso
            </Button>
          </motion.div>
        ) : (
          <motion.div variants={staggerItem} className="space-y-2">
            {(courses as any[]).map((course: any) => {
              const totalLessons = course.modules?.reduce(
                (sum: number, m: any) => sum + (m.lessons?.length ?? 0),
                0,
              ) ?? 0;

              return (
                <div
                  key={course.id}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {course.cover_url ? (
                      <img
                        src={course.cover_url}
                        alt={course.title}
                        className="w-10 h-10 rounded-[var(--radius-sm)] object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--bg-hover)] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {course.title}
                        </h3>
                        <Badge variant={statusVariant[course.status] ?? 'default'}>
                          {statusLabel[course.status] ?? course.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {course.modules?.length ?? 0} módulos · {totalLessons} aulas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/admin/cursos/${course.id}`}
                      className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1"
                    >
                      Editar
                    </Link>
                    {course.status !== 'published' && (
                      <button
                        onClick={() => publishMutation.mutate(course.id)}
                        disabled={publishMutation.isPending}
                        className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1"
                      >
                        Publicar
                      </button>
                    )}
                    {course.status === 'published' && (
                      <button
                        onClick={() => archiveMutation.mutate(course.id)}
                        disabled={archiveMutation.isPending}
                        className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1"
                      >
                        Arquivar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} className="sm:max-w-md">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Novo curso</h2>

          <div className="space-y-3">
            <Input
              label="Título *"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Estratégia Empresarial Avançada"
            />
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descrição breve do curso..."
                rows={3}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
              />
            </div>
            <CourseCoverUpload
              courseId={pendingIdRef.current}
              currentUrl={form.cover_url}
              onUploaded={(url) => setForm((f) => ({ ...f, cover_url: url }))}
            />
            <CourseBannerUpload
              courseId={pendingIdRef.current}
              currentUrl={form.banner_url}
              onUploaded={(url) => setForm((f) => ({ ...f, banner_url: url }))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleCreate}
              disabled={!form.title.trim() || !form.cover_url || !form.banner_url || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar curso'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
