import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/Button.tsx';
import { adminGetUserAuditLogs } from '../../services/admin.api.ts';
import { formatDateTime } from '../../helpers/format.ts';

interface TabHistoryProps {
  userId: string;
}

export function AdminUserDetailTabHistory({ userId }: TabHistoryProps) {
  const [page, setPage] = useState(0);
  const limit = 20;
  const offset = page * limit;

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['admin-user-audit', userId, offset],
    queryFn: () => adminGetUserAuditLogs(userId, { limit, offset }),
  });

  const logs = (auditData as any)?.data ?? [];
  const total = (auditData as any)?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
        Acoes registradas ({total})
      </h3>

      {isLoading ? (
        [1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)]" />
        ))
      ) : logs.length === 0 ? (
        <p className="text-xs text-[var(--text-tertiary)]">Nenhuma acao registrada para este usuario.</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log: any) => (
            <div key={log.id} className="px-3 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--text-primary)]">{log.action}</span>
                    {log.profiles?.full_name && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">por {log.profiles.full_name}</span>
                    )}
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5 truncate">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                  {formatDateTime(log.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">
            {offset + 1}–{Math.min(offset + limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Proximo</Button>
          </div>
        </div>
      )}
    </div>
  );
}
