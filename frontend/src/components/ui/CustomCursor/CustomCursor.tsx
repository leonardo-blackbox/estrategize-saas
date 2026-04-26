import { useRef, useEffect, useState } from 'react';

// Crosshair cursor — tracks mouse instantly (no lerp delay).
// 18px container, 6px arms, 5px center gap, 1.5px center dot, accent glow.
const SIZE = 18;
const ARM = 6;
const GAP = 2.5; // gap from center to arm start (each side)

export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    const el = ref.current;
    if (!el) return;

    let isTyping = false;

    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate3d(${e.clientX - SIZE / 2}px, ${e.clientY - SIZE / 2}px, 0)`;
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

  const c = SIZE / 2; // center coordinate

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
        pointerEvents: 'none',
        zIndex: 2147483647,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s ease',
        willChange: 'transform',
        filter: 'drop-shadow(0 0 4px rgba(100, 210, 255, 0.65))',
      }}
    >
      {/* Horizontal — left arm */}
      <div style={{ position: 'absolute', top: c - 0.5, left: 0, width: ARM, height: 1, background: 'rgba(255,255,255,0.9)' }} />
      {/* Horizontal — right arm */}
      <div style={{ position: 'absolute', top: c - 0.5, left: c + GAP, width: ARM, height: 1, background: 'rgba(255,255,255,0.9)' }} />
      {/* Vertical — top arm */}
      <div style={{ position: 'absolute', left: c - 0.5, top: 0, width: 1, height: ARM, background: 'rgba(255,255,255,0.9)' }} />
      {/* Vertical — bottom arm */}
      <div style={{ position: 'absolute', left: c - 0.5, top: c + GAP, width: 1, height: ARM, background: 'rgba(255,255,255,0.9)' }} />
      {/* Center dot */}
      <div style={{
        position: 'absolute',
        width: 1.5,
        height: 1.5,
        borderRadius: '50%',
        background: 'rgba(100, 210, 255, 1)',
        top: c - 0.75,
        left: c - 0.75,
      }} />
    </div>
  );
}
