import { NavLink, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../stores/themeStore.ts';
import { fetchBalance } from '../../api/credits.ts';
import { CreditsPill } from '../compound/CreditsPill.tsx';
import { cn } from '../../lib/cn.ts';

const navItems = [
  { to: '/formacao', label: 'Formação' },
  { to: '/ferramentas', label: 'Ferramentas' },
  { to: '/consultorias', label: 'Consultorias' },
  { to: '/conta', label: 'Conta' },
];

export function AppleNav() {
  const location = useLocation();
  const { theme } = useThemeStore();
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
  const isDark = theme === 'dark';

  return (
    /* 
      1) Fixed wrapper (plain HTML, NO framer-motion)
      This guarantees position:fixed is never interfered with by motion transforms.
      Uses left-0 right-0 mx-auto to center without relying on transform: translateX.
    */
    <div 
      className="fixed z-[100] top-3 sm:top-4 left-0 right-0 mx-auto w-[calc(100%-24px)] max-w-[860px] pointer-events-none"
      style={{
        marginTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* 
        2) Animated inner pill (motion.div)
        Handles the background, shadow, padding and opacity animation.
      */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          "pointer-events-auto",
          "h-12 rounded-full",
          "flex items-center justify-between relative px-2",
          "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
          "backdrop-blur-[40px] saturate-[1.8]",
          "[-webkit-backdrop-filter:blur(40px)_saturate(1.8)]",
          "transition-shadow duration-300"
        )}
        style={{
          boxShadow: scrolled
            ? 'inset 0 0.5px 0 0 var(--glass-highlight), 0 8px 32px rgba(0,0,0,0.18)'
            : 'inset 0 0.5px 0 0 var(--glass-highlight), 0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Left — Logo */}
        <div className="flex items-center shrink-0 pl-1 pr-3 z-10">
          <img
            src={isDark ? '/img/logo-nav-light.png' : '/img/logo-nav-dark.png'}
            alt="Estrategize"
            className="h-7 w-7 rounded-sm object-contain"
          />
        </div>

        {/* Center — Nav links (absolutely centered inside nav) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Desktop */}
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
          {/* Mobile */}
          <span className="lg:hidden text-[14px] font-semibold text-[var(--text-primary)] tracking-[-0.01em] pointer-events-auto">
            {navItems.find((i) => location.pathname.startsWith(i.to))?.label ?? 'Estrategize'}
          </span>
        </div>

        {/* Right — Actions (Simplified: only Credits) */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1 z-10">
          <NavLink to="/creditos" className="contents">
            <CreditsPill balance={creditBalance} />
          </NavLink>
        </div>
      </motion.nav>
    </div>
  );
}
