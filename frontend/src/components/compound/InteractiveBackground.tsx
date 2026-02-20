import { useEffect, useRef, useCallback } from 'react';
import { useThemeStore } from '../../stores/themeStore.ts';

/**
 * InteractiveBackground
 *
 * Premium CSS/DOM-only background with:
 * - Aurora gradient field (P&B only -- white/gray orbs)
 * - Noise texture overlay (SVG-based, ultra-low opacity)
 * - Mouse-follow light on desktop (via CSS custom properties)
 * - Theme-aware: lighter aurora for light mode, deeper for dark
 *
 * Rules enforced:
 * - NO color (no blue/indigo/purple)
 * - NO mix-blend-mode
 * - NO video / WebGL / canvas
 * - Disabled on prefers-reduced-motion
 */
export function InteractiveBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === 'light';

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    containerRef.current.style.setProperty('--mouse-x', `${x}%`);
    containerRef.current.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mql.matches) return;

    const isTouch = window.matchMedia('(hover: none)').matches;
    if (isTouch) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // P&B aurora colors -- neutral only
  const orbColor1 = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)';
  const orbColor2 = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)';
  const orbColor3 = isLight ? 'rgba(0, 0, 0, 0.015)' : 'rgba(255, 255, 255, 0.02)';
  const mouseColor = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)';
  const noiseOpacity = isLight ? 0.015 : 0.025;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      } as React.CSSProperties}
    >
      {/* Aurora gradient orbs -- neutral P&B */}
      <div
        className="absolute -top-[40%] -left-[20%] h-[80vh] w-[80vh] rounded-full"
        style={{
          background: `radial-gradient(circle, ${orbColor1} 0%, transparent 70%)`,
          animation: 'aurora-drift-1 25s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute -bottom-[30%] -right-[15%] h-[70vh] w-[70vh] rounded-full"
        style={{
          background: `radial-gradient(circle, ${orbColor2} 0%, transparent 70%)`,
          animation: 'aurora-drift-2 30s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute top-[20%] right-[10%] h-[50vh] w-[50vh] rounded-full"
        style={{
          background: `radial-gradient(circle, ${orbColor3} 0%, transparent 70%)`,
          animation: 'aurora-drift-3 20s ease-in-out infinite alternate',
        }}
      />

      {/* Mouse-follow light (desktop only) */}
      <div
        className="hidden lg:block absolute inset-0"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${mouseColor}, transparent 60%)`,
          transition: 'background 0.3s ease-out',
        }}
      />

      {/* Noise texture (inline SVG data URI for zero network requests) */}
      <div
        className="absolute inset-0"
        style={{
          opacity: noiseOpacity,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Keyframes for aurora drift */}
      <style>{`
        @keyframes aurora-drift-1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(10%, 15%) scale(1.1); }
        }
        @keyframes aurora-drift-2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-8%, -12%) scale(1.15); }
        }
        @keyframes aurora-drift-3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-12%, 8%) scale(0.95); }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-drift-1, .aurora-drift-2, .aurora-drift-3 {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
