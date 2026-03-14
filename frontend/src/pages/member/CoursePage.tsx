import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getCourse } from '../../api/courses.ts';
import { cn } from '../../lib/cn.ts';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';

function formatDuration(secs?: number) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-text-primary)] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-[11px] text-[var(--color-text-tertiary)]">{Math.round(value)}%</span>
    </div>
  );
}

export function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourse(id!),
    enabled: !!id,
  });

  // Abrir primeiro módulo por padrão
  useEffect(() => {
    if (data?.course.modules?.[0]) {
      setOpenModules(new Set([data.course.modules[0].id]));
    }
  }, [data?.course.modules]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-64 rounded-[24px] bg-[var(--color-bg-elevated)]" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-[16px] bg-[var(--color-bg-elevated)]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-[var(--color-text-secondary)]">Curso não encontrado.</p>
        <Link to="/formacao" className="mt-4 inline-block text-[var(--color-text-primary)] underline">
          Voltar à Formação
        </Link>
      </div>
    );
  }

  const { course, access, progress } = data;

  // Calcular progresso geral
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const completedCount = allLessons.filter((l) => progress[l.id]?.completed).length;
  const progressPct = allLessons.length > 0 ? (completedCount / allLessons.length) * 100 : 0;

  // Encontrar próxima aula não concluída
  const nextLesson = allLessons.find((l) => !progress[l.id]?.completed);

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto pb-24 lg:pb-12"
    >
      {/* Back */}
      <motion.div variants={staggerItem} className="mb-6">
        <Link
          to="/formacao"
          className="inline-flex items-center gap-2 text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Formação
        </Link>
      </motion.div>

      {/* Hero */}
      <motion.div variants={staggerItem}>
        <div
          className={cn(
            'relative overflow-hidden rounded-[24px] mb-8',
            'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
            'shadow-[0_4px_24px_rgba(0,0,0,0.15)]',
          )}
        >
          {(course.banner_url ?? course.cover_url) && (
            <div className="absolute inset-0">
              <img
                src={course.banner_url ?? course.cover_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            </div>
          )}

          <div className="relative z-10 p-8 sm:p-10 min-h-[280px] flex flex-col justify-end">
            <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-tight text-[var(--color-text-primary)] mb-2 max-w-xl">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-[15px] text-[var(--color-text-secondary)] mb-6 max-w-lg">
                {course.description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-xs">
                <ProgressBar value={progressPct} />
                <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1">
                  {completedCount} de {allLessons.length} aulas concluídas
                </p>
              </div>

              {nextLesson && access.allowed && (
                <button
                  onClick={() => navigate(`/formacao/aula/${nextLesson.id}`)}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-[15px] font-semibold text-[var(--color-bg-primary)] hover:opacity-90 active:scale-95 transition-all duration-200 min-h-[44px] shrink-0"
                >
                  {completedCount > 0 ? 'Continuar' : 'Começar'}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Módulos e aulas */}
      <motion.div variants={staggerItem} className="space-y-3">
        {course.modules.map((module, mi) => {
          const moduleLessons = module.lessons;
          const completedInModule = moduleLessons.filter((l) => progress[l.id]?.completed).length;
          const modulePct = moduleLessons.length > 0
            ? (completedInModule / moduleLessons.length) * 100
            : 0;
          const isOpen = openModules.has(module.id);

          return (
            <div
              key={module.id}
              className="rounded-[20px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] overflow-hidden"
            >
              {/* Module header */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-[var(--color-bg-elevated)] transition-colors min-h-[64px]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 w-7 h-7 rounded-full border border-[var(--color-border-subtle)] flex items-center justify-center text-[12px] font-bold text-[var(--color-text-tertiary)]">
                    {mi + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)] truncate">
                      {module.title}
                    </h3>
                    <p className="text-[12px] text-[var(--color-text-tertiary)]">
                      {completedInModule}/{moduleLessons.length} aulas · {Math.round(modulePct)}%
                    </p>
                  </div>
                </div>
                <svg
                  className={cn('h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200', isOpen && 'rotate-180')}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Lessons */}
              {isOpen && (
                <div className="border-t border-[var(--color-border-subtle)]">
                  {moduleLessons.map((lesson, li) => {
                    const lp = progress[lesson.id];
                    const isCompleted = lp?.completed ?? false;
                    const isInProgress = !isCompleted && (lp?.watched_secs ?? 0) > 0;
                    const isLocked = !access.allowed && !lesson.is_free_preview;

                    return (
                      <button
                        key={lesson.id}
                        disabled={isLocked}
                        onClick={() => !isLocked && navigate(`/formacao/aula/${lesson.id}`)}
                        className={cn(
                          'w-full flex items-center gap-4 px-5 py-4 text-left border-b border-[var(--color-border-subtle)] last:border-0 transition-colors min-h-[60px]',
                          isLocked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-[var(--color-bg-elevated)] cursor-pointer',
                        )}
                      >
                        {/* Status icon */}
                        <div className={cn(
                          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center border',
                          isCompleted
                            ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]'
                            : 'border-[var(--color-border-subtle)] bg-transparent',
                        )}>
                          {isCompleted ? (
                            <svg className="h-4 w-4 text-[var(--color-bg-primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : isLocked ? (
                            <svg className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                          ) : (
                            <span className="text-[12px] font-medium text-[var(--color-text-tertiary)]">{li + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-[var(--color-text-primary)] truncate">
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {lesson.duration_secs && (
                              <span className="text-[12px] text-[var(--color-text-tertiary)]">
                                {formatDuration(lesson.duration_secs)}
                              </span>
                            )}
                            {lesson.lesson_attachments.length > 0 && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-40" />
                                <span className="text-[12px] text-[var(--color-text-tertiary)]">
                                  {lesson.lesson_attachments.length} material(is)
                                </span>
                              </>
                            )}
                            {isInProgress && (
                              <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">Em andamento</span>
                            )}
                            {lesson.is_free_preview && !access.allowed && (
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Preview</span>
                            )}
                          </div>
                        </div>

                        {!isLocked && (
                          <svg className="shrink-0 h-4 w-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
