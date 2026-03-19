import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore.ts';
import { PageTransition } from '../motion/PageTransition.tsx';
import { cn } from '../../lib/cn.ts';

// ─── Types ────────────────────────────────────────────────────────
interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  disabled?: boolean;
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

// ─── Icons ────────────────────────────────────────────────────────
function IconPlay() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
    </svg>
  );
}

function IconCreditCard() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function IconPlug() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={cn('w-3 h-3 transition-transform duration-150', open && 'rotate-90')}
      fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

// ─── Nav structure ────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    id: 'membros',
    label: 'Área de Membros',
    icon: <IconPlay />,
    items: [
      { to: '/admin/cursos', label: 'Conteúdos' },
      { to: '/admin/home', label: 'Home' },
      { to: '/admin/usuarios', label: 'Usuários' },
      { to: '/admin/turmas', label: 'Turmas' },
    ],
  },
  {
    id: 'pagamentos',
    label: 'Pagamentos',
    icon: <IconCreditCard />,
    items: [
      { to: '/admin/ofertas', label: 'Ofertas' },
      { to: '/admin/stripe', label: 'Logs & Webhooks' },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <IconSettings />,
    items: [
      { to: '/admin/configuracoes', label: 'Geral', disabled: true, badge: 'em breve' },
    ],
  },
  {
    id: 'integracoes',
    label: 'Integrações',
    icon: <IconPlug />,
    items: [
      { to: '/admin/integracoes', label: 'Webhooks externos', disabled: true, badge: 'em breve' },
    ],
  },
];

// ─── NavSubItem ───────────────────────────────────────────────────
function NavSubItem({ item }: { item: NavItem }) {
  if (item.disabled) {
    return (
      <div className="flex items-center justify-between pl-3 pr-2 py-1.5 rounded-[var(--radius-sm)] opacity-40 cursor-default select-none">
        <span className="text-xs text-[var(--text-tertiary)]">{item.label}</span>
        {item.badge && (
          <span className="text-[9px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded">
            {item.badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center pl-3 pr-2 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors',
          isActive
            ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
        )
      }
    >
      {item.label}
    </NavLink>
  );
}

// ─── NavGroupItem ─────────────────────────────────────────────────
function NavGroupItem({
  group,
  expanded,
  onToggle,
}: {
  group: NavGroup;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
      >
        <span className="text-[var(--text-tertiary)]">{group.icon}</span>
        <span className="flex-1 text-left">{group.label}</span>
        <span className="text-[var(--text-tertiary)]">
          <IconChevron open={expanded} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-0.5 ml-2 space-y-0.5 border-l border-[var(--border-hairline)] pl-2">
              {group.items.map((item) => (
                <NavSubItem key={item.to} item={item} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AdminSidebar ─────────────────────────────────────────────────
function AdminSidebar({
  user,
  signOut,
  onNavClick,
}: {
  user: { email?: string } | null;
  signOut: () => void;
  onNavClick?: () => void;
}) {
  const location = useLocation();

  // Persist expanded state in localStorage
  const [expanded, setExpanded] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_nav_expanded') ?? '["membros"]') as string[];
    } catch {
      return ['membros'];
    }
  });

  // Auto-expand groups with active child
  useEffect(() => {
    const autoExpand: string[] = [];
    for (const group of NAV_GROUPS) {
      const hasActive = group.items.some(
        (item) => !item.disabled && location.pathname.startsWith(item.to),
      );
      if (hasActive) autoExpand.push(group.id);
    }
    if (autoExpand.length > 0) {
      setExpanded((prev) => Array.from(new Set([...prev, ...autoExpand])));
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('admin_nav_expanded', JSON.stringify(expanded));
  }, [expanded]);

  const toggleGroup = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-[var(--border-hairline)]">
        <div className="h-6 w-6 rounded-[var(--radius-sm)] bg-[var(--text-primary)] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-[var(--bg-base)]">A</span>
        </div>
        <span className="text-xs font-semibold text-[var(--text-primary)] tracking-tight">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1" onClick={onNavClick}>
        {/* Dashboard direct link */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
              isActive
                ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
            )
          }
        >
          <span className="text-[var(--text-tertiary)]"><IconGrid /></span>
          Dashboard
        </NavLink>

        {/* Groups */}
        {NAV_GROUPS.map((group) => (
          <NavGroupItem
            key={group.id}
            group={group}
            expanded={expanded.includes(group.id)}
            onToggle={() => toggleGroup(group.id)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[var(--border-hairline)] space-y-2">
        <Link
          to="/formacao"
          className="block text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          ← Voltar ao app
        </Link>
        <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.email}</p>
        <button
          onClick={() => void signOut()}
          className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

// ─── AdminShell ───────────────────────────────────────────────────
/**
 * AdminShell
 * Separate layout for admin sub-app.
 * Desktop: fixed sidebar + content area.
 * Mobile: header with hamburger + drawer.
 */
export function AdminShell() {
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div data-admin="true" className="min-h-[100dvh] flex bg-[var(--bg-base)] transition-colors duration-[var(--duration-normal)]">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 sticky top-0 h-[100dvh] border-r border-[var(--border-hairline)] bg-[var(--bg-surface-1)]">
        <AdminSidebar user={user} signOut={signOut} />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 flex h-12 items-center justify-between px-4 glass border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1 -ml-1 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Abrir menu"
            >
              <IconMenu />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-[var(--radius-sm)] bg-[var(--text-primary)] flex items-center justify-center">
                <span className="text-[9px] font-bold text-[var(--bg-base)]">A</span>
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)] tracking-tight">Admin</span>
            </div>
          </div>
          <Link
            to="/formacao"
            className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Voltar ao app
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col bg-[var(--bg-surface-1)] border-r border-[var(--border-hairline)]"
            >
              <AdminSidebar
                user={user}
                signOut={signOut}
                onNavClick={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
