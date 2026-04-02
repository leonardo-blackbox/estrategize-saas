import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { staggerItem } from '../../../../lib/motion.ts';
import type { Module, LessonProgress, CourseAccess } from '../../../../api/courses.ts';

function formatDuration(secs?: number) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  modules: Module[];
  progress: Record<string, LessonProgress>;
  access: CourseAccess;
  openModules: Set<string>;
  onToggleModule: (moduleId: string) => void;
}

export function CourseModuleList({ modules, progress, access, openModules, onToggleModule }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div variants={staggerItem} className="space-y-3">
      {modules.map((module, mi) => {
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
              onClick={() => onToggleModule(module.id)}
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
  );
}
