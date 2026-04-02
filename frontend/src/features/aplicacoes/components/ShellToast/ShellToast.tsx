import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';

interface ShellToastProps {
  message: string;
  link?: string;
  onDismiss: () => void;
}

export function ShellToast({ message, link, onDismiss }: ShellToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-[13px] text-[var(--text-primary)]',
      )}
    >
      <span className="text-[#30d158]">&#10003;</span>
      <span>{message}</span>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] underline underline-offset-2 hover:no-underline"
        >
          Ver formulario
        </a>
      )}
      <button
        onClick={onDismiss}
        className="ml-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        aria-label="Fechar notificacao"
      >
        x
      </button>
    </motion.div>
  );
}
