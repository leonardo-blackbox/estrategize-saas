import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore.ts';
import { PageTransition } from '../motion/PageTransition.tsx';
import { cn } from '../../lib/cn.ts';

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/ofertas', label: 'Ofertas' },
  { to: '/admin/turmas', label: 'Turmas' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/stripe', label: 'Stripe Logs' },
];

/**
 * AdminShell
 * Separate layout for admin sub-app.
 * Higher density, P&B, data-admin for subtle overrides.
 */
export function AdminShell() {
  const { user, signOut } = useAuthStore();
  const location = useLocation();

  return (
    <div data-admin="true" className="min-h-[100dvh] bg-[var(--bg-base)] transition-colors duration-[var(--duration-normal)]">
      {/* Admin top bar */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between px-4 sm:px-6 glass">
        <div className="flex items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-[var(--radius-sm)] bg-[var(--text-primary)] flex items-center justify-center">
              <span className="text-[10px] font-bold text-[var(--bg-base)]">A</span>
            </div>
            <span className="text-xs font-semibold text-[var(--text-primary)] tracking-tight">
              Admin
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <NavLink
            to="/formacao"
            className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Voltar ao app
          </NavLink>
          <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
            {user?.email}
          </span>
          <button
            onClick={() => void signOut()}
            className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Mobile admin nav (horizontal scroll) */}
      <div className="sm:hidden border-b border-[var(--border-hairline)] overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 px-4 py-2 min-w-max">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="px-4 sm:px-6 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
}
