import { PriorityBadge } from '../ConsultoriaDetailShared';
import { formatDate } from '../../consultorias.detail.helpers.ts';
import type { ActionItem } from '../../services/consultorias.api.ts';

interface ActionItemCardProps {
  item: ActionItem;
}

export function ActionItemCard({ item }: ActionItemCardProps) {
  return (
    <div className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-2)] border border-[var(--border-hairline)] space-y-2">
      <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{item.title}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <PriorityBadge priority={item.priority} />
        {item.due_date && <span className="text-[10px] text-[var(--text-muted)]">📅 {formatDate(item.due_date)}</span>}
      </div>
    </div>
  );
}
