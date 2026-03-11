import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { adminGetEnrollments, adminGetCourses } from '../../api/courses.ts';

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AdminTurmasPage() {
  const [courseFilter, setCourseFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  const { data: coursesData } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: adminGetCourses,
  });

  const { data: enrollData, isLoading } = useQuery({
    queryKey: ['admin-enrollments', courseFilter, page],
    queryFn: () => adminGetEnrollments({
      limit,
      offset: page * limit,
      course_id: courseFilter || undefined,
    }),
  });

  const courses = coursesData as any[] ?? [];
  const enrollments = (enrollData as any)?.enrollments ?? [];
  const total = (enrollData as any)?.total ?? 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-5"
    >
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Matrículas</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {total} matrícula{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}.
          </p>
        </div>
      </motion.div>

      {/* Course filter */}
      <motion.div variants={staggerItem}>
        <select
          value={courseFilter}
          onChange={(e) => { setCourseFilter(e.target.value); setPage(0); }}
          className="text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-1.5 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)] w-full sm:w-auto min-w-[200px]"
        >
          <option value="">Todos os cursos</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </motion.div>

      {/* Enrollments table */}
      <motion.div variants={staggerItem}>
        <div className="rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_140px] gap-x-4 px-4 py-2 border-b border-[var(--border-hairline)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Usuário</span>
            <span>Curso</span>
            <span>Matriculado em</span>
          </div>

          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse border-b border-[var(--border-hairline)] last:border-0 bg-[var(--bg-surface-1)]" />
            ))
          ) : enrollments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-[var(--text-tertiary)]">Nenhuma matrícula encontrada.</p>
            </div>
          ) : (
            enrollments.map((enr: any) => (
              <div
                key={enr.id}
                className="grid grid-cols-[1fr_1fr_140px] gap-x-4 items-center px-4 py-3 border-b border-[var(--border-hairline)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {enr.profiles?.full_name ?? 'Usuário'}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-mono truncate">{enr.user_id?.slice(0, 8)}…</p>
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {enr.courses?.title ?? enr.course_id}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">{formatDate(enr.enrolled_at)}</p>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Pagination */}
      {total > limit && (
        <motion.div variants={staggerItem} className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">
            {page * limit + 1}–{Math.min((page + 1) * limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors"
            >
              ← Anterior
            </button>
            <button
              disabled={(page + 1) * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors"
            >
              Próximo →
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
