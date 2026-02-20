import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn.ts';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export function NavItem({ to, label, icon, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]'
            : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
