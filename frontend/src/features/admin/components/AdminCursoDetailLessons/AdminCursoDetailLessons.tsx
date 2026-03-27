import type { LessonLink } from '../../services/admin.api.ts';

interface AdminCursoDetailLessonsProps {
  lessons: any[];
  confirmDeleteLesson: string | null;
  deleteLessonMutation: { mutate: (id: string) => void; isPending: boolean };
  onEditLesson: (lesson: any) => void;
  onDeleteLesson: (id: string) => void;
  onCancelDeleteLesson: () => void;
  onLinksLesson: (data: { id: string; title: string; links: LessonLink[] }) => void;
  onAddLesson: () => void;
}

export function AdminCursoDetailLessons({
  lessons, confirmDeleteLesson, deleteLessonMutation,
  onEditLesson, onDeleteLesson, onCancelDeleteLesson,
  onLinksLesson, onAddLesson,
}: AdminCursoDetailLessonsProps) {
  return (
    <div className="border-t border-[var(--border-hairline)]">
      {(lessons ?? []).map((lesson: any, li: number) => (
        <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-hairline)] last:border-0">
          <span className="shrink-0 text-[11px] font-medium text-[var(--text-tertiary)] w-5 text-center">{li + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{lesson.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {lesson.video_url && <span className="text-[10px] text-[var(--text-tertiary)]">Video</span>}
              {lesson.is_free_preview && <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Preview</span>}
              {lesson.duration_secs && <span className="text-[10px] text-[var(--text-tertiary)]">{Math.floor(lesson.duration_secs / 60)}min</span>}
              {lesson.drip_days > 0 && <span className="text-[10px] text-[var(--text-tertiary)]">drip {lesson.drip_days}d</span>}
              {(lesson.lesson_links ?? []).length > 0 && <span className="text-[10px] text-[var(--text-tertiary)]">{lesson.lesson_links.length} link(s)</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onLinksLesson({ id: lesson.id, title: lesson.title, links: lesson.lesson_links ?? [] })} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-1.5 py-1 transition-colors" title="Gerenciar links">🔗</button>
            <button onClick={() => onEditLesson(lesson)} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-1.5 py-1 transition-colors" title="Editar aula">✏️</button>
            {confirmDeleteLesson === lesson.id ? (
              <>
                <button onClick={() => deleteLessonMutation.mutate(lesson.id)} disabled={deleteLessonMutation.isPending} className="text-[10px] text-red-500 px-1.5 py-1">Confirmar</button>
                <button onClick={onCancelDeleteLesson} className="text-[10px] text-[var(--text-tertiary)] px-1.5 py-1">Nao</button>
              </>
            ) : (
              <button onClick={() => onDeleteLesson(lesson.id)} className="text-[10px] text-[var(--text-tertiary)] hover:text-red-500 px-1.5 py-1 transition-colors" title="Deletar aula">🗑</button>
            )}
          </div>
        </div>
      ))}
      <div className="px-4 py-2.5">
        <button onClick={onAddLesson} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">+ Adicionar aula</button>
      </div>
    </div>
  );
}
