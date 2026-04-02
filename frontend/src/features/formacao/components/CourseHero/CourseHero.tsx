import { motion } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { staggerItem } from '../../../../lib/motion.ts';

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

interface Props {
  title: string;
  description?: string;
  bannerUrl?: string;
  coverUrl?: string;
  progressPct: number;
  completedCount: number;
  totalLessons: number;
  nextLessonId?: string;
  accessAllowed: boolean;
  onContinue: () => void;
}

export function CourseHero({
  title,
  description,
  bannerUrl,
  coverUrl,
  progressPct,
  completedCount,
  totalLessons,
  nextLessonId,
  accessAllowed,
  onContinue,
}: Props) {
  const heroImage = bannerUrl ?? coverUrl;

  return (
    <motion.div variants={staggerItem}>
      <div
        className={cn(
          'relative overflow-hidden rounded-[24px] mb-8',
          'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
          'shadow-[0_4px_24px_rgba(0,0,0,0.15)]',
        )}
      >
        {heroImage && (
          <div className="absolute inset-0">
            <img src={heroImage} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          </div>
        )}

        <div className="relative z-10 p-8 sm:p-10 min-h-[280px] flex flex-col justify-end">
          <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-tight text-[var(--color-text-primary)] mb-2 max-w-xl">
            {title}
          </h1>
          {description && (
            <p className="text-[15px] text-[var(--color-text-secondary)] mb-6 max-w-lg">
              {description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-xs">
              <ProgressBar value={progressPct} />
              <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1">
                {completedCount} de {totalLessons} aulas concluidas
              </p>
            </div>

            {nextLessonId && accessAllowed && (
              <button
                onClick={onContinue}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-[15px] font-semibold text-[var(--color-bg-primary)] hover:opacity-90 active:scale-95 transition-all duration-200 min-h-[44px] shrink-0"
              >
                {completedCount > 0 ? 'Continuar' : 'Comecar'}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
