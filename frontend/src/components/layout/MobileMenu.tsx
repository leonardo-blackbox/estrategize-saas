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
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">I</span>
            </div>
            <span className="text-lg font-bold text-white">Iris Platform</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-white transition-colors"
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
