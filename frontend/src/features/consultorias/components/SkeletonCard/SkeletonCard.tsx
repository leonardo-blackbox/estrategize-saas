export function SkeletonCard() {
  return (
    <div
      className="rounded-[var(--radius-md)] p-4 overflow-hidden"
      style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-hairline)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar skeleton */}
        <div className="h-11 w-11 rounded-[var(--radius-sm)] animate-pulse shrink-0" style={{ background: 'var(--bg-surface-2)' }} />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3.5 w-28 rounded-full animate-pulse" style={{ background: 'var(--bg-surface-2)' }} />
          <div className="h-2.5 w-20 rounded-full animate-pulse" style={{ background: 'var(--bg-surface-2)' }} />
        </div>
        {/* Badge skeleton */}
        <div className="h-5 w-20 rounded-full animate-pulse shrink-0" style={{ background: 'var(--bg-surface-2)' }} />
      </div>
      {/* Progress skeleton */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between">
          <div className="h-2 w-24 rounded-full animate-pulse" style={{ background: 'var(--bg-surface-2)' }} />
          <div className="h-2 w-8 rounded-full animate-pulse" style={{ background: 'var(--bg-surface-2)' }} />
        </div>
        <div className="h-1.5 w-full rounded-full animate-pulse" style={{ background: 'var(--bg-surface-2)' }} />
      </div>
      {/* Tags skeleton */}
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: 'var(--bg-surface-2)' }} />
        <div className="h-5 w-20 rounded-full animate-pulse" style={{ background: 'var(--bg-surface-2)' }} />
      </div>
    </div>
  );
}
