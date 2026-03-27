import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';

interface AdminCursoDetailHeaderProps {
  course: any;
  onEditClick: () => void;
}

export function AdminCursoDetailHeader({ course, onEditClick }: AdminCursoDetailHeaderProps) {
  return (
    <>
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
            <img src={course.cover_url} alt={course.title} className="w-20 h-20 rounded-[var(--radius-sm)] object-cover shrink-0" />
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
                    {(course.modules ?? []).length} modulos
                  </span>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={onEditClick}>Editar</Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
