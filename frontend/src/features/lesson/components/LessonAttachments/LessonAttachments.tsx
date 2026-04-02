import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import type { Attachment } from '../../../../api/courses.ts';

function FileTypeIcon({ type }: { type?: string }) {
  const t = (type ?? '').toLowerCase();
  if (t.includes('pdf')) return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

interface Props {
  attachments: Attachment[];
}

export function LessonAttachments({ attachments }: Props) {
  if (attachments.length === 0) return null;

  return (
    <motion.div variants={staggerItem} className="mt-8">
      <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)] mb-4">
        Materiais
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map((att) => (
          <a
            key={att.id}
            href={att.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4 hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-elevated)] transition-all duration-200 group"
          >
            <div className="shrink-0 w-9 h-9 rounded-full bg-[var(--color-bg-active)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
              <FileTypeIcon type={att.file_type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">{att.title}</p>
              {att.file_size && (
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  {(att.file_size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
            <svg className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </a>
        ))}
      </div>
    </motion.div>
  );
}
