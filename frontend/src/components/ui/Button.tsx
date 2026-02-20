import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/cn.ts';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'frosted';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--text-primary)] text-[var(--bg-base)]',
    'hover:opacity-90',
    'active:opacity-80',
    'shadow-[var(--shadow-soft)]',
  ].join(' '),
  secondary: [
    'bg-transparent text-[var(--text-primary)]',
    'ring-1 ring-inset ring-[var(--border-default)]',
    'hover:bg-[var(--bg-hover)]',
    'active:bg-[var(--bg-active)]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--text-secondary)]',
    'hover:text-[var(--text-primary)]',
    'hover:bg-[var(--bg-hover)]',
    'active:bg-[var(--bg-active)]',
  ].join(' '),
  frosted: [
    'glass',
    'text-[var(--text-primary)]',
    'hover:bg-[var(--bg-hover)]',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[14px] gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', fullWidth, className, children, ...props },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'rounded-[var(--radius-pill)]',
          'transition-all duration-[var(--duration-fast)]',
          'cursor-pointer select-none',
          'disabled:opacity-40 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
