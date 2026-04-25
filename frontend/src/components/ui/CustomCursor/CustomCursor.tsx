import { useRef, useEffect, useState } from 'react';

/**
 * CustomCursor — Glass Inverter cursor.
 *
 * A 44px circle with backdrop-filter: invert(1) + blur(1.5px).
 * On the dark dot-grid it creates a glowing, washed-out "lens" effect.
 * On light areas it inverts to dark — always readable.
 *
 * - Moves via transform: translate3d (GPU, no layout thrashing)
 * - Lerp factor matches DynamicGrid so magnetism + cursor feel in sync
 * - Hides on mouse leave / typing (input focus)
 * - pointer-events: none → click-through
 * - Disabled on touch devices (matchMedia hover: none)
 */

const LERP = 0.14; // slightly snappier than the grid (0.10) — cursor leads slightly
const SIZE = 24;   // diameter in px

export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -200, y: -200 });
  const lerpRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Touch / stylus → no custom cursor
    if (window.matchMedia('(hover: none)').matches) return;

    const el = ref.current;
    if (!el) return;

    let isTyping = false;

    function loop() {
      lerpRef.current.x += (posRef.current.x - lerpRef.current.x) * LERP;
      lerpRef.current.y += (posRef.current.y - lerpRef.current.y) * LERP;

      el!.style.transform = `translate3d(${lerpRef.current.x - SIZE / 2}px, ${lerpRef.current.y - SIZE / 2}px, 0)`;
      rafRef.current = requestAnimationFrame(loop);
    }

    const onMove = (e: MouseEvent) => {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
      if (!visible && !isTyping) setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => { if (!isTyping) setVisible(true); };

    // Hide cursor while user is typing (UX: native cursor inside inputs)
    const onFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
        isTyping = true;
        setVisible(false);
      }
    };
    const onFocusOut = () => {
      isTyping = false;
      setVisible(true);
    };

    window.addEventListener('mousemove', onMove);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Touch → render nothing
  if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
    return null;
  }

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 2147483647,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.18s ease',
        // Glass inverter effect
        backdropFilter: 'invert(1) blur(1.5px)',
        WebkitBackdropFilter: 'invert(1) blur(1.5px)',
        // Subtle ring so the lens boundary is visible
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
        willChange: 'transform, opacity',
      }}
    />
  );
}
