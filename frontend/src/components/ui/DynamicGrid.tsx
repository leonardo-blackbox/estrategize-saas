import { useRef, useEffect } from 'react';

/**
 * DynamicGrid — Canvas dot grid: drift parallax + magnetic cursor + spotlight.
 *
 * --- Tune these to calibrate the feel ---
 * speed           → drift cycle in seconds
 * dotSize         → dot radius in px
 * gridSize        → spacing between dot centres in px
 * magneticRadius  → cursor pull area in px
 * magneticStrength → max dot displacement toward cursor in px
 * lightRadius     → spotlight gradient radius in px
 * minOpacity      → dot opacity far from cursor (desktop) / base opacity (mobile)
 * maxOpacity      → dot opacity at cursor centre
 *
 * --- Performance ---
 * All dots drawn in one batched path · one ctx.fill() per frame
 * Squared-distance guard skips sqrt for dots outside magnetic radius
 * Mobile: magnetic + spotlight disabled automatically (hover: none)
 */
export const GRID_CONFIG = {
  speed: 12,
  dotSize: 1,
  gridSize: 14,
  magneticRadius: 150,
  magneticStrength: 4,
  lightRadius: 220,
  minOpacity: 0.07,
  maxOpacity: 0.88,
} as const;

type Colors = { min: string; max: string; base: string };

function buildColors(): Colors {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDark
    ? {
        // Dark mode: dim teal base → vivid bright green at cursor (emissive feel)
        min:  'rgba(45, 150, 110, 0.07)',
        max:  'rgba(100, 235, 175, 0.88)',
        base: 'rgba(45, 150, 110, 0.28)',
      }
    : {
        // Light mode: barely-there green → deep forest green at cursor
        min:  'rgba(6, 78, 59, 0.07)',
        max:  'rgba(8, 115, 75, 0.85)',
        base: 'rgba(6, 78, 59, 0.28)',
      };
}

export function DynamicGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {
      speed, dotSize, gridSize,
      magneticRadius, magneticStrength,
      lightRadius,
    } = GRID_CONFIG;

    const radiusSq = magneticRadius * magneticRadius;

    // Touch devices: drift only — no listeners, no battery waste
    const isTouch = window.matchMedia('(hover: none)').matches;

    // Colors — refreshed on theme switch
    let colors = buildColors();
    const themeObs = new MutationObserver(() => { colors = buildColors(); });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Mouse state — large negative sentinel = "off screen"
    let mouseX = -99999, mouseY = -99999;
    let lerpX  = -99999, lerpY  = -99999;
    const LERP = 0.10;

    let rafId: number;
    const startTime = performance.now();

    // ── Resize: match canvas resolution to physical pixels (max 2×) ──────────
    function resize() {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width  = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.scale(dpr, dpr);
    }

    // ── Main RAF loop ─────────────────────────────────────────────────────────
    function frame() {
      const elapsed = (performance.now() - startTime) / 1000;
      // Drift: 0 → gridSize linearly over `speed` seconds, seamless loop
      const drift = ((elapsed % speed) / speed) * gridSize;

      const W = window.innerWidth;
      const H = window.innerHeight;

      // Smooth mouse tracking
      if (!isTouch && mouseX > -9000) {
        lerpX += (mouseX - lerpX) * LERP;
        lerpY += (mouseY - lerpY) * LERP;
      }

      ctx.clearRect(0, 0, W, H);

      // ── Fill style: radial gradient (spotlight) or flat (mobile / no mouse) ──
      const hasMouse = !isTouch && lerpX > -9000;

      if (hasMouse) {
        // Spotlight gradient centred on cursor:
        //   stop 0 (centre) → maxOpacity vivid colour
        //   stop 1 (edge)   → minOpacity dim colour
        // Canvas fills each dot arc with the gradient value at that dot's position,
        // so near-cursor dots are bright and far dots are barely visible — 1 draw call.
        const grad = ctx.createRadialGradient(
          lerpX, lerpY, 0,
          lerpX, lerpY, lightRadius,
        );
        grad.addColorStop(0, colors.max);
        grad.addColorStop(1, colors.min);
        ctx.fillStyle = grad;
      } else {
        // Mobile → readable base opacity; desktop no-mouse → barely visible
        ctx.fillStyle = isTouch ? colors.base : colors.min;
      }

      // ── Single batched path for all dots ──────────────────────────────────
      ctx.beginPath();

      const cols = Math.ceil(W / gridSize) + 2;
      const rows = Math.ceil(H / gridSize) + 2;

      for (let c = -1; c < cols; c++) {
        for (let r = -1; r < rows; r++) {
          let x = c * gridSize + drift;
          let y = r * gridSize + drift;

          // Magnetic displacement (desktop + mouse in range)
          if (hasMouse) {
            const dx = lerpX - x;
            const dy = lerpY - y;
            const dSq = dx * dx + dy * dy;
            if (dSq < radiusSq && dSq > 0) {
              const dist  = Math.sqrt(dSq);
              const force = (1 - dist / magneticRadius) * magneticStrength;
              x += (dx / dist) * force;
              y += (dy / dist) * force;
            }
          }

          // moveTo prevents a line connecting consecutive arcs
          ctx.moveTo(x + dotSize, y);
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        }
      }

      ctx.fill();
      rafId = requestAnimationFrame(frame);
    }

    // ── Mouse listeners ───────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Snap lerp on first entry — no swooping from off-screen
      if (lerpX < -9000) { lerpX = mouseX; lerpY = mouseY; }
    };
    const onLeave = () => {
      mouseX = -99999; mouseY = -99999;
      lerpX  = -99999; lerpY  = -99999;
    };

    resize();
    window.addEventListener('resize', resize);
    if (!isTouch) {
      window.addEventListener('mousemove', onMove);
      document.documentElement.addEventListener('mouseleave', onLeave);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      if (!isTouch) {
        window.removeEventListener('mousemove', onMove);
        document.documentElement.removeEventListener('mouseleave', onLeave);
      }
      themeObs.disconnect();
    };
  }, []);

  return (
    <div aria-hidden="true" className="dynamic-grid-outer">
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
