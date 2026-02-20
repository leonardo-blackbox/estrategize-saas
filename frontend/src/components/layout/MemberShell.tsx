import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header.tsx';
import { BottomTabs } from './BottomTabs.tsx';
import { MemberSidebar } from './MemberSidebar.tsx';
import { InteractiveBackground } from '../compound/InteractiveBackground.tsx';
import { PageTransition } from '../motion/PageTransition.tsx';

/**
 * MemberShell
 * Main layout for authenticated member pages.
 * - Mobile: Header + content + BottomTabs
 * - Desktop: Sidebar + Header + content
 * - InteractiveBackground only on /formacao
 */
export function MemberShell() {
  const location = useLocation();
  const showBackground = location.pathname === '/formacao' || location.pathname.startsWith('/formacao/');

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] transition-colors duration-[var(--duration-normal)]">
      {/* Interactive background (only on /formacao) */}
      {showBackground && <InteractiveBackground />}

      {/* Desktop sidebar */}
      <MemberSidebar />

      {/* Main area */}
      <div className="lg:pl-[220px] relative z-10">
        <Header />

        {/* Page content with bottom padding for mobile tabs */}
        <main
          className="px-4 sm:px-6 py-4 sm:py-6 pb-[calc(var(--bottom-tabs-height)+var(--safe-area-bottom)+16px)] lg:pb-6"
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
