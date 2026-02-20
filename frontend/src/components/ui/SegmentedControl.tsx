import { motion } from 'framer-motion';
import { cn } from '../../lib/cn.ts';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-1',
        'rounded-[var(--radius-pill)]',
        'bg-[var(--bg-surface-2)]',
        'ring-1 ring-inset ring-[var(--border-hairline)]',
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative px-4 py-1.5',
              'rounded-[var(--radius-pill)]',
              'text-[13px] font-medium',
              'transition-colors duration-[var(--duration-fast)]',
              'cursor-pointer select-none',
              isActive
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="segmented-indicator"
                className={cn(
                  'absolute inset-0',
                  'rounded-[var(--radius-pill)]',
                  'bg-[var(--bg-elevated)]',
                  'shadow-[var(--shadow-soft)]',
                  'ring-1 ring-inset ring-[var(--border-hairline)]',
                )}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
