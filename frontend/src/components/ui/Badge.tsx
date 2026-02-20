import { cn } from '../../lib/cn.ts';

type BadgeVariant = 'default' | 'locked' | 'drip' | 'expiring' | 'success';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: [
    'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
    'ring-1 ring-inset ring-[var(--border-hairline)]',
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
    'bg-[var(--bg-hover)] text-[var(--color-warning)]',
    'ring-1 ring-inset ring-[var(--border-default)]',
  ].join(' '),
  success: [
    'bg-[var(--bg-hover)] text-[var(--color-success)]',
    'ring-1 ring-inset ring-[var(--border-default)]',
  ].join(' '),
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5',
        'rounded-[var(--radius-pill)]',
        'text-[11px] font-semibold tracking-tight',
        'select-none',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
