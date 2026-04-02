import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { staggerItem } from '../../../../lib/motion.ts';

interface Props {
  courseId: string;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  isLast: boolean;
}

export function LessonNavigation({ courseId, prevLesson, nextLesson, isLast }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div variants={staggerItem} className="mt-8 pt-6 border-t border-[var(--color-border-subtle)] flex justify-between gap-4">
      {prevLesson ? (
        <button
          onClick={() => navigate(`/formacao/aula/${prevLesson.id}`)}
          className="inline-flex items-center gap-2 text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] px-2 text-left"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span className="truncate max-w-[140px]">{prevLesson.title}</span>
        </button>
      ) : (
        <Link
          to={`/formacao/curso/${courseId}`}
          className="inline-flex items-center gap-2 text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] px-2"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Ver modulos
        </Link>
      )}

      {isLast ? (
        <Link
          to={`/formacao/curso/${courseId}`}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all duration-200 min-h-[44px]',
            'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:opacity-90 active:scale-95',
          )}
        >
          Concluir curso
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </Link>
      ) : nextLesson ? (
        <button
          onClick={() => navigate(`/formacao/aula/${nextLesson.id}`)}
          className="inline-flex items-center gap-2 text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] px-2 text-right"
        >
          <span className="truncate max-w-[140px]">{nextLesson.title}</span>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      ) : (
        <Link
          to={`/formacao/curso/${courseId}`}
          className="inline-flex items-center gap-2 text-[14px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] px-2"
        >
          Ver todos os modulos
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}
    </motion.div>
  );
}
