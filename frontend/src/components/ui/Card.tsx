import { cn } from '../../lib/cn.ts';

type CardVariant = 'default' | 'glass' | 'elevated' | 'interactive' | 'gradient' | 'outline';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantClasses: Record<CardVariant, string> = {
  default: [
    'bg-[var(--bg-surface-1)]',
    'border border-[var(--border-hairline)]',
    'shadow-[var(--shadow-soft)]',
    'hover:shadow-[var(--shadow-card-hover)]',
    'hover:-translate-y-0.5',
    'hover:border-[var(--border-default)]',
  ].join(' '),

  elevated: [
    'bg-[var(--bg-elevated)]',
    'border border-[var(--border-default)]',
    'shadow-[var(--shadow-elev)]',
    'hover:shadow-[var(--shadow-card-hover)]',
    'hover:-translate-y-1',
    'hover:border-[var(--border-strong)]',
  ].join(' '),

  glass: [
    'glass',
    'hover:shadow-[var(--shadow-card-hover)]',
    'hover:-translate-y-0.5',
  ].join(' '),

  interactive: [
    'bg-[var(--bg-surface-1)]',
    'border border-[var(--border-hairline)]',
    'shadow-[var(--shadow-soft)]',
    'cursor-pointer',
    'hover:shadow-[var(--shadow-card-hover)]',
    'hover:-translate-y-1',
    'hover:border-[var(--accent)]',
    'hover:bg-[var(--accent-muted)]',
    'active:translate-y-0 active:shadow-[var(--shadow-soft)]',
  ].join(' '),

  gradient: [
    'bg-[var(--bg-surface-1)]',
    'border border-[var(--border-hairline)]',
    'shadow-[var(--shadow-soft)]',
    'relative overflow-hidden',
    'before:absolute before:inset-0',
    'before:bg-gradient-to-br before:from-[var(--accent-muted)] before:to-transparent',
    'before:pointer-events-none',
    'hover:shadow-[var(--shadow-card-hover)]',
    'hover:-translate-y-0.5',
    'hover:border-[var(--accent-subtle)]',
  ].join(' '),

  outline: [
    'bg-transparent',
    'border border-[var(--border-default)]',
    'hover:border-[var(--border-strong)]',
    'hover:bg-[var(--bg-hover)]',
  ].join(' '),
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  variant = 'default',
  className,
  as: Tag = 'div',
  onClick,
  padding = 'md',
}: CardProps) {
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'rounded-[var(--radius-card)]',
        'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out-expo)]',
        paddingClasses[padding],
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
