import { NavItem } from './NavItem.tsx';
import { navItems } from './navItems.tsx';

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-700 bg-slate-900">
      <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-6">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-sm font-bold text-white">I</span>
        </div>
        <span className="text-lg font-bold text-white">Iris Platform</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}
      </nav>
    </aside>
  );
}
