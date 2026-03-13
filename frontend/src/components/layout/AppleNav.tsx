import { NavLink, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore.ts';
import { useIsAdmin } from '../../hooks/useProfile.ts';
import { fetchBalance } from '../../api/credits.ts';
import { CreditsPill } from '../compound/CreditsPill.tsx';
import { ThemeToggle } from '../ui/ThemeToggle.tsx';
import { cn } from '../../lib/cn.ts';

/**
 * AppleNav — Apple-style centered pill navigation
 *
 * Layout: [Logo] ---- [nav links absolutely centered] ---- [actions]
 * The center links use absolute positioning for true centering.
 * Left/right blocks have z-10 so they sit above the center overlay.
 */

const navItems = [
  { to: '/formacao', label: 'Formação' },
  { to: '/ferramentas', label: 'Ferramentas' },
  { to: '/consultorias', label: 'Consultorias' },
  { to: '/conta', label: 'Conta' },
];

export function AppleNav() {
  const location = useLocation();
  const { signOut } = useAuthStore();
  const isAdmin = useIsAdmin();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  const { data: balanceData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: fetchBalance,
    staleTime: 60_000,
  });

  const creditBalance = balanceData?.data?.available ?? 0;

  return (
    <motion.nav
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-[100]',
        'w-[calc(100%-24px)] max-w-[860px]',
        'h-12',
        'rounded-full',
        'flex items-center justify-between relative',
        'px-1.5',
        // Glass
        'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
        '[backdrop-filter:blur(40px)_saturate(180%)]',
        '[-webkit-backdrop-filter:blur(40px)_saturate(180%)]',
        // Transition
        'transition-shadow duration-300',
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      style={{
        top: 'calc(12px + env(safe-area-inset-top, 0px))',
        boxShadow: scrolled
          ? 'inset 0 0.5px 0 0 var(--glass-highlight), 0 4px 24px rgba(0,0,0,0.12)'
          : 'inset 0 0.5px 0 0 var(--glass-highlight), 0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left — Logo (z-10 to sit above center links) */}
      <div className="flex items-center shrink-0 pl-2 pr-3 z-10">
        <img
          src="/img/logo-nav-dark.png"
          alt="Estrategize"
          className="h-7 w-7 rounded-lg object-contain dark:hidden"
        />
        <img
          src="/img/logo-nav-light.png"
          alt="Estrategize"
          className="h-7 w-7 rounded-lg object-contain hidden dark:block"
        />
      </div>

      {/* Center — Nav links absolutely centered within the pill */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="hidden lg:flex items-center gap-0.5 pointer-events-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-full text-[13px] font-medium leading-none whitespace-nowrap',
                  'transition-all duration-150',
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Mobile — show page name */}
        <span className="lg:hidden text-[14px] font-semibold text-[var(--text-primary)] tracking-[-0.01em] pointer-events-auto">
          {navItems.find((i) => location.pathname.startsWith(i.to))?.label ?? 'Estrategize'}
        </span>
      </div>

      {/* Right — Actions (z-10 to sit above center links) */}
      <div className="flex items-center gap-1.5 shrink-0 pr-1 z-10">
        <NavLink
          to="/creditos"
          className="contents"
        >
          <CreditsPill balance={creditBalance} />
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide',
              'ring-1 ring-inset ring-[var(--border-default)]',
              'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
              'hover:bg-[var(--bg-hover)] transition-all duration-150',
            )}
          >
            Admin
          </NavLink>
        )}

        <ThemeToggle className="hidden sm:inline-flex" />

        <button
          onClick={() => void signOut()}
          className={cn(
            'rounded-full px-3 py-1.5 text-[11px] font-medium',
            'text-[var(--text-tertiary)]',
            'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
            'active:scale-[0.96] transition-all duration-150',
            'cursor-pointer hidden sm:inline-flex',
          )}
        >
          Sair
        </button>
      </div>
    </motion.nav>
  );
}
