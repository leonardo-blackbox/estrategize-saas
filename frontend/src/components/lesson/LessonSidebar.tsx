import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn.ts';
import type { Course, LessonProgress } from '../../api/courses.ts';

interface Props {
  course: Course;
  currentLessonId: string;
  progress: Record<string, LessonProgress>;
}

export function LessonSidebar({ course, currentLessonId, progress }: Props) {
  const navigate = useNavigate();

  const sortedModules = [...course.modules].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] px-1 mb-3">
        Conteúdo do curso
      </p>
      {sortedModules.map((mod) => {
        const sortedLessons = [...mod.lessons].sort((a, b) => a.sort_order - b.sort_order);

        return (
          <div
            key={mod.id}
            className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)] leading-snug">
                {mod.title}
              </p>
            </div>
            <div>
              {sortedLessons.map((lesson) => {
                const lp = progress[lesson.id];
                const isCompleted = lp?.completed ?? false;
                const isCurrent = lesson.id === currentLessonId;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => navigate(`/formacao/aula/${lesson.id}`)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[var(--color-border-subtle)] last:border-0 transition-colors text-[13px]',
                      isCurrent
                        ? 'bg-[var(--color-bg-active)]'
                        : 'hover:bg-[var(--color-bg-elevated)]',
                    )}
                  >
                    {/* Status icon */}
                    <div
                      className={cn(
                        'shrink-0 w-5 h-5 rounded-full flex items-center justify-center border text-[10px]',
                        isCompleted
                          ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]'
                          : isCurrent
                          ? 'border-[var(--color-text-primary)] bg-transparent'
                          : 'border-[var(--color-border-subtle)] bg-transparent',
                      )}
                    >
                      {isCompleted ? (
                        <svg className="h-3 w-3 text-[var(--color-bg-primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : isCurrent ? (
                        <svg className="h-2.5 w-2.5 text-[var(--color-text-primary)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        'flex-1 leading-snug truncate',
                        isCurrent
                          ? 'text-[var(--color-text-primary)] font-medium'
                          : isCompleted
                          ? 'text-[var(--color-text-tertiary)]'
                          : 'text-[var(--color-text-secondary)]',
                      )}
                    >
                      {lesson.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
