import { cn } from '../../../../lib/cn.ts';

export function SkeletonCard() {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] overflow-hidden',
        'bg-[var(--bg-surface-1)]',
        'ring-1 ring-[var(--border-hairline)]',
        'animate-pulse',
      )}
    >
      <div className="h-40 bg-[var(--bg-surface-2)]" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-20 rounded-full bg-[var(--bg-surface-3)]" />
        <div className="h-4 w-3/4 rounded bg-[var(--bg-surface-3)]" />
        <div className="h-3 w-1/2 rounded bg-[var(--bg-surface-2)]" />
      </div>
    </div>
  );
}
