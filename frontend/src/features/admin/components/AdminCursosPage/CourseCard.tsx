import { Link } from 'react-router-dom';
import { Badge } from '../../../../components/ui/Badge.tsx';

interface CourseCardProps {
  course: { id: string; title: string; status: string; cover_url?: string; modules?: { lessons?: unknown[] }[] };
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  isPublishPending: boolean;
  isArchivePending: boolean;
}

const STATUS_VARIANT: Record<string, 'success' | 'locked' | 'default'> = { published: 'success', draft: 'default', archived: 'locked' };
const STATUS_LABEL: Record<string, string> = { published: 'Publicado', draft: 'Rascunho', archived: 'Arquivado' };

export function CourseCard({ course, onPublish, onArchive, isPublishPending, isArchivePending }: CourseCardProps) {
  const totalLessons = course.modules?.reduce((sum: number, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0;
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
      <div className="flex items-center gap-3 min-w-0">
        {course.cover_url
          ? <img src={course.cover_url} alt={course.title} className="w-10 h-10 rounded-[var(--radius-sm)] object-cover shrink-0" />
          : <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--bg-hover)] shrink-0" />
        }
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">{course.title}</h3>
            <Badge variant={STATUS_VARIANT[course.status] ?? 'default'}>{STATUS_LABEL[course.status] ?? course.status}</Badge>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{course.modules?.length ?? 0} módulos · {totalLessons} aulas</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link to={`/admin/cursos/${course.id}`} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1">Editar</Link>
        {course.status !== 'published' && (
          <button onClick={() => onPublish(course.id)} disabled={isPublishPending} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1">Publicar</button>
        )}
        {course.status === 'published' && (
          <button onClick={() => onArchive(course.id)} disabled={isArchivePending} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1">Arquivar</button>
        )}
      </div>
    </div>
  );
}
