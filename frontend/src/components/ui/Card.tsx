import { cn } from '../../lib/cn.ts';

type CardVariant = 'default' | 'glass';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export function Card({ children, variant = 'default', className, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-[var(--radius-card)] p-6',
        'transition-colors duration-[var(--duration-normal)]',
        variant === 'default' && [
          'bg-[var(--bg-surface-1)]',
          'border border-[var(--border-hairline)]',
          'shadow-[var(--shadow-soft)]',
        ],
        variant === 'glass' && 'glass',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
