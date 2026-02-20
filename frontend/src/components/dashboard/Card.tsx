interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Legacy Card component — kept for zero-breakage migration.
 * New code should use src/components/ui/Card.tsx instead.
 */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-soft)] transition-colors duration-[var(--duration-normal)] ${className}`}
    >
      {children}
    </div>
  );
}
