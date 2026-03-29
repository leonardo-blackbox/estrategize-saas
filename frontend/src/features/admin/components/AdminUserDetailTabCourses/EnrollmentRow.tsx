import { formatDate } from '../../helpers/format.ts';

interface EnrollmentRowProps {
  enrollment: {
    id: string;
    course_id: string;
    enrolled_at: string;
    courses?: { title: string } | null;
  };
  progress?: { completed_lessons: number; total_lessons: number } | null;
}

export function EnrollmentRow({ enrollment, progress }: EnrollmentRowProps) {
  const pct = progress && progress.total_lessons > 0
    ? Math.round((progress.completed_lessons / progress.total_lessons) * 100)
    : 0;

  return (
    <div className="rounded-[var(--radius-sm)] px-3 py-2.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
          {enrollment.courses?.title ?? enrollment.course_id}
        </p>
        <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">{formatDate(enrollment.enrolled_at)}</span>
      </div>
      {progress && (
        <div className="mt-1.5 space-y-1">
          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>Progresso</span>
            <span>{progress.completed_lessons}/{progress.total_lessons} aulas</span>
          </div>
          <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
            <div
              className="h-full bg-[var(--text-primary)] rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
