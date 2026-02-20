import type { Consultancy } from '../../api/consultancies.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';

interface ConsultancyCardProps {
  consultancy: Consultancy;
  onEdit: (c: Consultancy) => void;
  onDelete: (c: Consultancy) => void;
  onDiagnosis?: (c: Consultancy) => void;
}

export function ConsultancyCard({ consultancy, onEdit, onDelete, onDiagnosis }: ConsultancyCardProps) {
  const created = new Date(consultancy.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--bg-hover)] flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            {consultancy.title}
          </h3>
          {consultancy.client_name && (
            <p className="mt-1 text-[15px] text-[var(--text-secondary)]">{consultancy.client_name}</p>
          )}
        </div>
        <Badge variant={consultancy.status === 'active' ? 'success' : 'locked'}>
          {consultancy.status === 'active' ? 'Active' : 'Archived'}
        </Badge>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-4 mt-2">
        <span className="text-[13px] text-[var(--text-tertiary)]">Created {created}</span>
        <div className="flex gap-2">
          {onDiagnosis && (
            <Button variant="secondary" size="sm" onClick={() => onDiagnosis(consultancy)}>
              Diagnose
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onEdit(consultancy)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(consultancy)}
            className="text-[var(--color-error)] hover:text-[var(--color-error)]"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
