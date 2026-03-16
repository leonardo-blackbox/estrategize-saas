import { cn } from '../../lib/cn.ts';

type BadgeVariant = 'default' | 'accent' | 'locked' | 'drip' | 'expiring' | 'success' | 'error' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: [
    'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
    'ring-1 ring-inset ring-[var(--border-hairline)]',
  ].join(' '),

  accent: [
    'bg-[var(--accent-subtle)] text-[var(--accent)]',
    'ring-1 ring-inset ring-[var(--accent-subtle)]',
  ].join(' '),

  outline: [
    'bg-transparent text-[var(--text-secondary)]',
    'ring-1 ring-inset ring-[var(--border-default)]',
  ].join(' '),

  locked: [
    'bg-[var(--bg-surface-2)] text-[var(--text-muted)]',
    'ring-1 ring-inset ring-[var(--border-hairline)]',
  ].join(' '),

  drip: [
    'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
    'ring-1 ring-inset ring-[var(--border-default)]',
  ].join(' '),

  expiring: [
    'bg-[rgba(255,159,10,0.08)] text-[var(--color-warning)]',
    'ring-1 ring-inset ring-[rgba(255,159,10,0.20)]',
  ].join(' '),

  success: [
    'bg-[rgba(52,199,89,0.08)] text-[var(--color-success)]',
    'ring-1 ring-inset ring-[rgba(52,199,89,0.20)]',
  ].join(' '),

  error: [
    'bg-[rgba(255,59,48,0.08)] text-[var(--color-error)]',
    'ring-1 ring-inset ring-[rgba(255,59,48,0.20)]',
  ].join(' '),
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-0.5 text-[11px] gap-1.5',
};

const dotColors: Record<BadgeVariant, string> = {
  default:  'bg-[var(--text-muted)]',
  accent:   'bg-[var(--accent)]',
  outline:  'bg-[var(--text-tertiary)]',
  locked:   'bg-[var(--text-muted)]',
  drip:     'bg-[var(--text-secondary)]',
  expiring: 'bg-[var(--color-warning)]',
  success:  'bg-[var(--color-success)]',
  error:    'bg-[var(--color-error)]',
};

export function Badge({ children, variant = 'default', size = 'md', dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center',
        'rounded-[var(--radius-pill)]',
        'font-semibold tracking-tight',
        'select-none whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
