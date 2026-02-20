import { NavItem } from './NavItem.tsx';
import { navItems } from './navItems.tsx';

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[var(--border-hairline)] bg-[var(--bg-base)]">
      <div className="flex h-16 items-center gap-2 border-b border-[var(--border-hairline)] px-6">
        <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--text-primary)] flex items-center justify-center">
          <span className="text-sm font-bold text-[var(--bg-base)]">I</span>
        </div>
        <span className="text-lg font-bold text-[var(--text-primary)]">Iris Platform</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}
      </nav>
    </aside>
  );
}
