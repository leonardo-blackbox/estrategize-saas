import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn.ts';

interface CreditsPillProps {
  balance?: number;
  className?: string;
}

/**
 * CreditsPill
 * Shown in header. Displays credit balance as a compact pill.
 * Links to /creditos page.
 */
export function CreditsPill({ balance = 0, className }: CreditsPillProps) {
  return (
    <Link
      to="/creditos"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1',
        'text-[13px] font-medium transition-all duration-200',
        'bg-[var(--bg-surface-2)] text-[var(--text-primary)]',
        'ring-1 ring-inset ring-[var(--border-hairline)]',
        'hover:bg-[var(--bg-hover)]',
        'active:scale-95',
        className,
      )}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
      </svg>
      <span>{balance}</span>
    </Link>
  );
}
