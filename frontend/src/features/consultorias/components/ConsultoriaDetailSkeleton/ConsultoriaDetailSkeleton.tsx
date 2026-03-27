import { Skeleton } from '../ConsultoriaDetailShared';

export function ConsultoriaDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-24" />
        <span className="text-[var(--text-tertiary)]">/</span>
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-start gap-4">
        <Skeleton className="w-14 h-14 shrink-0 rounded-[var(--radius-lg)]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[var(--radius-md)]" />
        ))}
      </div>
      <div className="flex gap-0 border-b border-[var(--border-hairline)]">
        {[80, 60, 80, 60, 70, 90, 80, 110, 70, 80, 80, 70].map((w, i) => (
          <Skeleton key={i} className={`h-8 w-${w} rounded-t mx-1`} />
        ))}
      </div>
    </div>
  );
}
