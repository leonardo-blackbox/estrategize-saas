import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn.ts';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Bottom-sheet on mobile */
  sheet?: boolean;
  /** Prevent closing on overlay click */
  persistent?: boolean;
  /** Title for aria */
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const easeOutExpo:  [number, number, number, number] = [0.16, 1, 0.3, 1];
const easeOutQuart: [number, number, number, number] = [0.25, 1, 0.5, 1];
const spring:       [number, number, number, number] = [0.34, 1.56, 0.64, 1];

const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.14 } },
};

const contentVariants = {
  hidden:  { opacity: 0, scale: 0.94, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: spring } },
  exit:    { opacity: 0, scale: 0.96, y: 6, transition: { duration: 0.16, ease: easeOutQuart } },
};

const sheetVariants = {
  hidden:  { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easeOutExpo } },
  exit:    { opacity: 0, y: '100%', transition: { duration: 0.22, ease: easeOutQuart } },
};

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  children,
  className,
  sheet = false,
  persistent = false,
  title,
  size = 'md',
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, persistent]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50"
            style={{
              WebkitBackdropFilter: 'blur(12px) saturate(160%)',
              backdropFilter: 'blur(12px) saturate(160%)',
            }}
            onClick={persistent ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Content */}
          <motion.div
            ref={contentRef}
            variants={sheet ? sheetVariants : contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'relative z-10',
              sheet
                ? [
                    'fixed bottom-0 left-0 right-0',
                    'rounded-t-[var(--radius-modal)]',
                    'pb-[max(var(--safe-area-bottom),16px)]',
                    'max-h-[92dvh] overflow-y-auto scrollbar-thin',
                  ]
                : [
                    'mx-4 w-full',
                    sizeClasses[size],
                    'rounded-[var(--radius-modal)]',
                    'max-h-[90dvh] overflow-y-auto scrollbar-thin',
                  ],
              'glass-strong',
              'p-6',
              'shadow-[var(--shadow-modal)]',
              className,
            )}
          >
            {/* Sheet handle */}
            {sheet && (
              <div className="flex justify-center mb-4">
                <div className="h-1 w-10 rounded-full bg-[var(--text-muted)] opacity-60" />
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
