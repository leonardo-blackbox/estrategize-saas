import { useRef, useEffect, useState } from 'react';

// Cursor SVG arrow — hotspot at tip (0,0), viewBox 14x22.
// White fill + dark stroke, subtle glow. Zero lag.
const ARROW = 'M1 1 L1 19 L5 15.5 L8.5 22 L11 21 L7.5 14.5 L13 14.5 Z';

export function CustomCursor() {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    const el = ref.current;
    if (!el) return;

    let isTyping = false;

    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (!isTyping) setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => { if (!isTyping) setVisible(true); };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
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

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return null;

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 14 23"
      width={14}
      height={23}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 2147483647,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s ease',
        willChange: 'transform',
        overflow: 'visible',
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))',
      }}
    >
      <path
        d={ARROW}
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(30,30,30,0.85)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
