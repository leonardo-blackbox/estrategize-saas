import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppleNav } from './AppleNav.tsx';
import { BottomTabs } from './BottomTabs.tsx';
import { PageTransition } from '../motion/PageTransition.tsx';

/**
 * MemberShell
 * - Desktop: Apple-style fixed top nav + full-width content
 * - Mobile: AppleNav (compact) + content + BottomTabs
 *
 * pt-[120px] = Espaçamento generoso para o conteúdo flutuar abaixo do menu fixo (Apple style).
 */
export function MemberShell() {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] transition-colors duration-[var(--duration-normal)] overflow-x-hidden">
      {/* Fixed pill nav — stays at top always */}
      <AppleNav />

      {/* Content — padded top so it starts BELOW the fixed nav */}
      <main className="pt-[80px] md:pt-[120px] pb-[calc(var(--bottom-tabs-height,56px)+env(safe-area-inset-bottom,0px)+16px)] lg:pb-8 px-5 sm:px-8 lg:px-12">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      <BottomTabs />
    </div>
  );
}
