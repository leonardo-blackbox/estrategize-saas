import { useEffect } from 'react';
import { NavItem } from './NavItem.tsx';
import { navItems } from './navItems.tsx';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[var(--bg-base)] border-r border-[var(--border-hairline)] flex flex-col">
        <div className="flex h-16 items-center justify-between border-b border-[var(--border-hairline)] px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--text-primary)] flex items-center justify-center">
              <span className="text-sm font-bold text-[var(--bg-base)]">I</span>
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">Iris Platform</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} onClick={onClose} />
          ))}
        </nav>
      </div>
    </div>
  );
}
