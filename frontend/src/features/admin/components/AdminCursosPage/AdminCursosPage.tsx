import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  adminGetCourses,
  adminCreateCourse,
  adminPublishCourse,
  adminArchiveCourse,
} from '../../../../api/courses.ts';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { CourseCard } from './CourseCard.tsx';
import { CourseCreateModal } from './CourseCreateModal.tsx';
import { CourseStatusTabs } from './CourseStatusTabs.tsx';

interface CourseFormData {
  title: string;
  description: string;
  cover_url: string;
  banner_url: string;
  stripe_product_id?: string | null;
}

const initialForm: CourseFormData = {
  title: '',
  description: '',
  cover_url: '',
  banner_url: '',
  stripe_product_id: null,
};

export function AdminCursosPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CourseFormData>(initialForm);
  const [statusFilter, setStatusFilter] = useState('all');
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
      stripe_product_id: form.stripe_product_id || undefined,
    });
  };

  const allCourses = courses as any[];
  const counts = {
    all: allCourses.length,
    published: allCourses.filter((c) => c.status === 'published').length,
    draft: allCourses.filter((c) => c.status === 'draft').length,
    archived: allCourses.filter((c) => c.status === 'archived').length,
  };
  const filteredCourses = statusFilter === 'all'
    ? allCourses
    : allCourses.filter((c) => c.status === statusFilter);

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

        <motion.div variants={staggerItem}>
          <CourseStatusTabs
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            counts={counts}
          />
        </motion.div>

        {isLoading ? (
          <motion.div variants={staggerItem} className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
            ))}
          </motion.div>
        ) : filteredCourses.length === 0 ? (
          <motion.div
            variants={staggerItem}
            className="rounded-[var(--radius-md)] p-12 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center"
          >
            <p className="text-sm text-[var(--text-tertiary)]">
              {statusFilter === 'all' ? 'Nenhum curso criado ainda.' : `Nenhum curso ${statusFilter === 'published' ? 'publicado' : statusFilter === 'draft' ? 'em rascunho' : 'arquivado'}.`}
            </p>
            {statusFilter === 'all' && (
              <Button size="sm" className="mt-4" onClick={openCreate}>
                Criar primeiro curso
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div variants={staggerItem} className="space-y-2">
            {filteredCourses.map((course: any) => (
              <CourseCard
                key={course.id}
                course={course}
                onPublish={(id) => publishMutation.mutate(id)}
                onArchive={(id) => archiveMutation.mutate(id)}
                isPublishPending={publishMutation.isPending}
                isArchivePending={archiveMutation.isPending}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      <CourseCreateModal
        open={showCreate}
        form={form}
        pendingId={pendingIdRef.current}
        isPending={createMutation.isPending}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        setForm={setForm}
      />
    </>
  );
}
