import type { Variants, Transition } from 'framer-motion';

/**
 * Estrategize Motion System
 * Apple-like, fast, consistent transitions.
 * All animations respect prefers-reduced-motion via Framer Motion's built-in support.
 */

// ── Shared Easings (cubic-bezier tuples) ──
type CubicBezier = [number, number, number, number];
const easeOutExpo: CubicBezier = [0.16, 1, 0.3, 1];
const easeOutQuart: CubicBezier = [0.25, 1, 0.5, 1];

// ── Shared Transitions ──
export const springGentle: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
};

export const transitionFast: Transition = {
  duration: 0.15,
  ease: easeOutExpo,
};

export const transitionNormal: Transition = {
  duration: 0.25,
  ease: easeOutExpo,
};

export const transitionSlow: Transition = {
  duration: 0.4,
  ease: easeOutExpo,
};

// ── Page Transition (depth crossfade) ──
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.3,
      ease: easeOutExpo,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: {
      duration: 0.2,
      ease: easeOutQuart,
    },
  },
};

// ── Stagger Container ──
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

// ── Stagger Item (fade + slide up) ──
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: easeOutExpo,
    },
  },
};

// ── Scroll Reveal ──
export const scrollReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutExpo,
    },
  },
};

// ── Button Press (scale 0.98) ──
export const buttonPress = {
  whileTap: { scale: 0.98 },
  transition: transitionFast,
};

// ── Card Hover Tilt (desktop only, max 2 deg) ──
export const cardHover = {
  whileHover: {
    y: -2,
    transition: transitionNormal,
  },
};
