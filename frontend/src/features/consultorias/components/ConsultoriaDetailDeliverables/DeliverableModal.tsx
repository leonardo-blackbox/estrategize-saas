import { AnimatePresence, motion } from 'framer-motion';
import type { Deliverable } from '../../services/consultorias.api.ts';

interface DeliverableModalProps {
  deliverable: Deliverable | null;
  onClose: () => void;
}

function renderContent(content: Record<string, unknown>): string {
  if (typeof content.text === 'string') return content.text;
  if (typeof content.body === 'string') return content.body;
  if (typeof content.content === 'string') return content.content;
  return JSON.stringify(content, null, 2);
}

export function DeliverableModal({ deliverable, onClose }: DeliverableModalProps) {
  return (
    <AnimatePresence>
      {deliverable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full sm:max-w-2xl max-h-[85dvh] flex flex-col rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] bg-[var(--bg-surface-1)] border border-[var(--border-default)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-hairline)] shrink-0">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] truncate pr-4">{deliverable.title}</h2>
              <button
                onClick={onClose}
                className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                aria-label="Fechar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <pre className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
                {renderContent(deliverable.content)}
              </pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
