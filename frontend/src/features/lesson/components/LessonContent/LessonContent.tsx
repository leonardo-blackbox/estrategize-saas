import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import { LessonMarkdown } from '../LessonMarkdown/index.ts';
import type { LessonLink } from '../../../../api/courses.ts';

function formatDuration(secs?: number) {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  title: string;
  description?: string;
  durationSecs?: number;
  readingTimeMins: number;
  completed: boolean;
  links: LessonLink[];
  ctaButtons: LessonLink[];
  onMarkComplete: () => void;
}

export function LessonContent({
  title, description, durationSecs, readingTimeMins,
  completed, links, ctaButtons, onMarkComplete,
}: Props) {
  return (
    <>
      {/* Header + actions */}
      <motion.div variants={staggerItem} className="mt-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {durationSecs && (
              <span className="text-[13px] text-[var(--color-text-tertiary)]">{formatDuration(durationSecs)} de video</span>
            )}
            {readingTimeMins > 0 && durationSecs && (
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)] opacity-40" />
            )}
            {readingTimeMins > 0 && (
              <span className="text-[13px] text-[var(--color-text-tertiary)]">{readingTimeMins}min de leitura</span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {completed ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bg-active)] border border-[var(--color-border-subtle)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Concluida
            </div>
          ) : (
            <button onClick={onMarkComplete} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-bg-primary)] hover:opacity-90 active:scale-95 transition-all duration-200 min-h-[44px]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Marcar como concluida
            </button>
          )}
        </div>
      </motion.div>

      {description && (
        <motion.div variants={staggerItem} className="mt-4">
          <LessonMarkdown text={description} />
        </motion.div>
      )}

      {ctaButtons.length > 0 && (
        <motion.div variants={staggerItem} className="mt-6 flex flex-wrap gap-3">
          {ctaButtons.map((btn) => (
            <a key={btn.id} href={btn.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-bg-primary)] hover:opacity-90 active:scale-95 transition-all duration-200">
              {btn.label}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          ))}
        </motion.div>
      )}

      {links.length > 0 && (
        <motion.div variants={staggerItem} className="mt-5">
          <h3 className="text-[13px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">Links</h3>
          <div className="space-y-1.5">
            {links.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors group">
                <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                {link.label}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}
