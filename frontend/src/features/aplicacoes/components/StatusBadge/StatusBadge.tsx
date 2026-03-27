import { cn } from '../../../../lib/cn.ts';
import type { Application } from '../../../../api/applications.ts';

interface StatusBadgeProps {
  status: Application['status'];
}

const STATUS_CONFIG: Record<
  Application['status'],
  { dot: string; label: string }
> = {
  published: { dot: 'bg-green-500', label: 'Publicado' },
  draft: { dot: 'bg-amber-400', label: 'Rascunho' },
  archived: { dot: 'bg-[var(--text-tertiary)]', label: 'Arquivado' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-1 rounded-full',
        'text-[11px] font-medium',
        'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
        'ring-1 ring-[var(--border-hairline)]',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}
