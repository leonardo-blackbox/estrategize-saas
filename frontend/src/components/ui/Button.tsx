import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/cn.ts';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'frosted' | 'gradient' | 'destructive';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-[var(--accent)] text-[var(--accent-text)]',
    'hover:bg-[var(--accent-hover)]',
    'shadow-[var(--shadow-soft)]',
    'hover:shadow-[var(--shadow-elev)]',
  ].join(' '),

  gradient: [
    'bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)]',
    'text-[var(--accent-text)]',
    'shadow-[var(--shadow-soft)]',
    'hover:shadow-[var(--shadow-glow)]',
    'hover:brightness-110',
  ].join(' '),

  secondary: [
    'bg-transparent text-[var(--text-primary)]',
    'ring-1 ring-inset ring-[var(--border-default)]',
    'hover:bg-[var(--bg-hover)]',
    'hover:ring-[var(--border-strong)]',
    'active:bg-[var(--bg-active)]',
  ].join(' '),

  ghost: [
    'bg-transparent text-[var(--text-secondary)]',
    'hover:text-[var(--text-primary)]',
    'hover:bg-[var(--bg-hover)]',
    'active:bg-[var(--bg-active)]',
  ].join(' '),

  frosted: [
    'glass text-[var(--text-primary)]',
    'hover:bg-[var(--bg-hover)]',
    'hover:shadow-[var(--shadow-elev)]',
  ].join(' '),

  destructive: [
    'bg-[var(--color-error)] text-white',
    'hover:opacity-90',
    'shadow-[0_2px_8px_rgba(255,59,48,0.25)]',
    'hover:shadow-[0_4px_16px_rgba(255,59,48,0.35)]',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] gap-1 font-semibold tracking-wide',
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[14px] gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
  xl: 'h-13 px-7 text-[16px] gap-2.5',
};

const spinnerSize: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      loading,
      icon,
      iconRight,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: isDisabled ? 1 : 0.97 }}
        whileHover={{ y: isDisabled ? 0 : -0.5 }}
        transition={{ duration: 0.12, ease: [0.34, 1.56, 0.64, 1] }}
        disabled={isDisabled}
        className={cn(
          'relative inline-flex items-center justify-center font-medium',
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
        {/* Loading overlay */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner className={spinnerSize[size]} />
          </span>
        )}

        {/* Content */}
        <span className={cn('inline-flex items-center gap-inherit', loading && 'invisible')}>
          {icon && <span className="shrink-0 [&>svg]:w-[1em] [&>svg]:h-[1em]">{icon}</span>}
          {children}
          {iconRight && <span className="shrink-0 [&>svg]:w-[1em] [&>svg]:h-[1em]">{iconRight}</span>}
        </span>
      </motion.button>
    );
  },
);
