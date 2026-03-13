import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppleNav } from './AppleNav.tsx';
import { BottomTabs } from './BottomTabs.tsx';
import { InteractiveBackground } from '../compound/InteractiveBackground.tsx';
import { PageTransition } from '../motion/PageTransition.tsx';

/**
 * MemberShell
 * Main layout for authenticated member pages.
 * - Desktop: Apple-style centered top nav + content (no sidebar)
 * - Mobile: AppleNav (compact) + content + BottomTabs
 * - InteractiveBackground only on /formacao
 */
export function MemberShell() {
  const location = useLocation();
  const showBackground = location.pathname === '/formacao' || location.pathname.startsWith('/formacao/');

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] transition-colors duration-[var(--duration-normal)] overflow-x-hidden">
      {/* Interactive background (only on /formacao) */}
      {showBackground && <InteractiveBackground />}

      {/* Apple-style centered nav */}
      <AppleNav />

      {/* Main area — offset for fixed nav + safe area */}
      <div className="relative" style={{ paddingTop: 'calc(var(--apple-nav-height) + env(safe-area-inset-top, 0px) + 24px)' }}>
        {/* Page content with bottom padding for mobile tabs */}
        <main
          className="px-5 sm:px-8 lg:px-10 py-4 sm:py-6 pb-[calc(var(--bottom-tabs-height)+var(--safe-area-bottom)+16px)] lg:pb-6 max-w-6xl mx-auto"
        >
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <BottomTabs />
    </div>
  );
}
