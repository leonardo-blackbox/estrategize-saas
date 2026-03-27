import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../../../../lib/cn.ts';
import type { ContinueLearningData } from '../../formacao.types';

interface FormacaoHeroProps {
  data: ContinueLearningData;
}

export function FormacaoHero({ data }: FormacaoHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/formacao/aula/${data.lessonId}`}
        className={cn(
          'group relative block overflow-hidden rounded-[24px]',
          'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
          'transition-all duration-300 hover:border-[var(--color-border-default)]',
          'shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
        )}
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          {data.thumbnail && (
            <img
              src={data.thumbnail}
              alt={data.title}
              className="w-full h-full object-cover opacity-50 grayscale mix-blend-luminosity motion-safe:group-hover:scale-[1.02] motion-safe:group-hover:opacity-60 transition-all duration-[800ms] ease-out"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-end min-h-[360px] sm:min-h-[440px]">
          <div className="text-[12px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">
            Continuar aprendendo
          </div>
          <h2 className="text-[28px] sm:text-[40px] font-semibold tracking-tight text-[var(--color-text-primary)] leading-tight mb-2 max-w-2xl">
            {data.title}
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[var(--color-text-secondary)] mb-8">
            {data.module} &middot; {data.lesson}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex-1 w-full max-w-sm">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-text-primary)] rounded-full motion-safe:transition-all motion-safe:duration-500 ease-out"
                    style={{ width: `${data.progress}%` }}
                  />
                </div>
                <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
                  {data.progress}%
                </span>
              </div>
            </div>

            <div className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-[15px] font-semibold text-[var(--accent-text)] motion-safe:transition-transform motion-safe:duration-200 active:scale-95 hover:bg-[var(--accent-hover)] min-w-[140px] min-h-[44px]">
              Continuar
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
