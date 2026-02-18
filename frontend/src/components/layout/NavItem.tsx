import { NavLink } from 'react-router-dom';

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
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-slate-700 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
