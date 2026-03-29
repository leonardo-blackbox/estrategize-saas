interface AuditLog {
  id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  created_at?: string | null;
  metadata?: unknown;
  profiles?: { full_name?: string } | null;
}

interface AuditTabProps {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  formatDate: (iso?: string | null) => string;
}

export function AuditTab({ logs, total, page, limit, isLoading, onPageChange, formatDate }: AuditTabProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_160px] gap-x-3 px-4 py-2 border-b border-[var(--border-hairline)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Ação</span><span>Detalhes</span><span>Data</span>
        </div>

        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse border-b border-[var(--border-hairline)] last:border-0" />
          ))
        ) : logs.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-[var(--text-tertiary)]">Nenhuma ação registrada.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-[140px_1fr_160px] gap-x-3 items-center px-4 py-3 border-b border-[var(--border-hairline)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="text-xs font-medium text-[var(--text-primary)] truncate">{log.action}</span>
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--text-secondary)] truncate">
                  {log.profiles?.full_name ?? 'Sistema'} → {log.target_type} {log.target_id?.slice(0, 8)}
                </p>
                {log.metadata && (
                  <p className="text-[10px] text-[var(--text-tertiary)] font-mono truncate">
                    {JSON.stringify(log.metadata)}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)]">{formatDate(log.created_at)}</span>
            </div>
          ))
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">
            {page * limit + 1}–{Math.min((page + 1) * limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => onPageChange(page - 1)} className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors">
              ← Anterior
            </button>
            <button disabled={(page + 1) * limit >= total} onClick={() => onPageChange(page + 1)} className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors">
              Próximo →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
