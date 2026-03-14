import { useEffect, useRef, useCallback } from 'react';
import { useThemeStore } from '../../stores/themeStore.ts';

/**
 * InteractiveBackground
 *
 * Premium CSS/DOM-only background with:
 * - Noise texture overlay (SVG-based, ultra-low opacity)
 * - Uniform background without gradient "orbs" so the sides don't look different
 * - Mouse-follow light on desktop (via CSS custom properties)
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

  const mouseColor = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)';
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
      {/* Mouse-follow light (desktop only) */}
      <div
        className="hidden lg:block absolute inset-0"
        style={{
          background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), ${mouseColor}, transparent 50%)`,
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
    </div>
  );
}
