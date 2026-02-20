import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn.ts';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Use bottom-sheet layout on mobile */
  sheet?: boolean;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1];

const contentVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: easeOutQuart },
  },
};

const sheetVariants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: 0.2, ease: easeOutQuart },
  },
};

export function Modal({ open, onClose, children, className, sheet = false }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Overlay with glass blur */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute inset-0',
              'bg-black/40',
              '-webkit-backdrop-filter: blur(8px)',
              'backdrop-blur-sm',
            )}
            style={{
              WebkitBackdropFilter: 'blur(8px)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Content */}
          <motion.div
            ref={contentRef}
            variants={sheet ? sheetVariants : contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative z-10',
              sheet
                ? [
                    'fixed bottom-0 left-0 right-0',
                    'rounded-t-[var(--radius-modal)]',
                    'pb-[var(--safe-area-bottom)]',
                    'max-h-[85dvh] overflow-y-auto',
                  ]
                : [
                    'mx-4 w-full max-w-lg',
                    'rounded-[var(--radius-modal)]',
                    'max-h-[85dvh] overflow-y-auto',
                  ],
              'glass',
              'p-6',
              'shadow-[var(--shadow-elev)]',
              className,
            )}
          >
            {/* Sheet drag indicator */}
            {sheet && (
              <div className="flex justify-center mb-3">
                <div className="h-1 w-9 rounded-full bg-[var(--text-muted)]" />
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
