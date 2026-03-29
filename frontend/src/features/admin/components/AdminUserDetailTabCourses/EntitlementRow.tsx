import { cn } from '../../../../lib/cn.ts';
import { formatDate, ACCESS_LABELS, ACCESS_VARIANT } from '../../helpers/format.ts';

interface EntitlementRowProps {
  entitlement: {
    id: string;
    access: string;
    expires_at: string | null;
    reason: string | null;
    courses?: { title: string } | null;
  };
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}

export function EntitlementRow({ entitlement, onRevoke, isRevoking }: EntitlementRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
          {entitlement.courses?.title ?? 'Acesso global'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
            ACCESS_VARIANT[entitlement.access] ?? ACCESS_VARIANT.allow,
          )}>
            {ACCESS_LABELS[entitlement.access] ?? entitlement.access}
          </span>
          {entitlement.expires_at && (
            <span className="text-[10px] text-[var(--text-tertiary)]">Expira {formatDate(entitlement.expires_at)}</span>
          )}
          {entitlement.reason && (
            <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[140px]">{entitlement.reason}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onRevoke(entitlement.id)}
        disabled={isRevoking}
        className="shrink-0 text-[10px] text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
      >
        Revogar
      </button>
    </div>
  );
}
