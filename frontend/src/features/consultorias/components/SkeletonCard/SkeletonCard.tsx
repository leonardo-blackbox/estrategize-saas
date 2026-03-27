export function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-md)] p-4 border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-[var(--radius-sm)] bg-[var(--bg-hover)] animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded bg-[var(--bg-hover)] animate-pulse" />
          <div className="h-3 w-24 rounded bg-[var(--bg-hover)] animate-pulse" />
        </div>
      </div>
      <div className="h-1 w-full rounded-full bg-[var(--bg-hover)] animate-pulse" />
    </div>
  );
}
