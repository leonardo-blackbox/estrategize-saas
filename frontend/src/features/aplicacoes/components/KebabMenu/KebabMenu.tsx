import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { buildMenuItems, type KebabMenuProps } from './menuItems';

export type { KebabMenuProps };

export function KebabMenu(props: KebabMenuProps) {
  const { onOpenChange } = props;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggle = (v: boolean) => { setOpen(v); onOpenChange?.(v); };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) toggle(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => toggle(!open)}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          'hover:bg-[var(--bg-hover)] transition-colors duration-150',
        )}
        aria-label="Mais opções"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="13" r="1.2" />
        </svg>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute right-0 top-10 z-50 w-44 rounded-[var(--radius-md)] overflow-hidden',
              'bg-[var(--bg-surface-2)] ring-1 ring-[var(--border-subtle)] shadow-[var(--shadow-elev)] py-1',
            )}
          >
            {buildMenuItems(props).map((item) => (
              <button
                key={item.label}
                onClick={() => { item.onClick(); toggle(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-left transition-colors duration-100',
                  item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                )}
              >
                <span className={item.danger ? 'text-red-400' : 'text-[var(--text-tertiary)]'}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
