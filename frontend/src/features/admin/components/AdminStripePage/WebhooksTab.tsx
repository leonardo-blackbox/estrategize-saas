import { cn } from '../../../../lib/cn.ts';

interface WebhooksTabProps {
  webhooks: { id: string; event_type: string; event_id: string; provider: string; status: string; created_at?: string | null; error?: string | null }[];
  total: number; page: number; limit: number; isLoading: boolean;
  statusFilter: string; providerFilter: string;
  onPageChange: (p: number) => void;
  onStatusFilter: (v: string) => void;
  onProviderFilter: (v: string) => void;
  formatDate: (iso?: string | null) => string;
  statusStyle: Record<string, string>;
}

export function WebhooksTab({ webhooks, total, page, limit, isLoading, statusFilter, providerFilter, onPageChange, onStatusFilter, onProviderFilter, formatDate, statusStyle }: WebhooksTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select value={statusFilter} onChange={(e) => { onStatusFilter(e.target.value); onPageChange(0); }} className="text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-2 py-1.5 text-[var(--text-secondary)] focus:outline-none">
          <option value="">Todos status</option>
          <option value="processed">Processed</option>
          <option value="failed">Failed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
        </select>
        <select value={providerFilter} onChange={(e) => { onProviderFilter(e.target.value); onPageChange(0); }} className="text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-2 py-1.5 text-[var(--text-secondary)] focus:outline-none">
          <option value="">Todos providers</option>
          <option value="stripe">Stripe</option>
          <option value="hotmart">Hotmart</option>
          <option value="kiwify">Kiwify</option>
        </select>
      </div>
      <div className="rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_140px_80px] gap-x-3 px-4 py-2 border-b border-[var(--border-hairline)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span>Tipo / ID</span><span>Provider</span><span>Status</span><span>Data</span><span>Erro</span>
        </div>
        {isLoading ? [1,2,3,4,5].map((i) => <div key={i} className="h-12 animate-pulse border-b border-[var(--border-hairline)] last:border-0 bg-[var(--bg-surface-1)]" />) : webhooks.length === 0 ? (
          <div className="py-10 text-center"><p className="text-xs text-[var(--text-tertiary)]">Nenhum evento encontrado.</p></div>
        ) : webhooks.map((ev) => (
          <div key={ev.id} className="grid grid-cols-[1fr_100px_100px_140px_80px] gap-x-3 items-center px-4 py-3 border-b border-[var(--border-hairline)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{ev.event_type}</p>
              <p className="text-[10px] text-[var(--text-tertiary)] font-mono truncate">{ev.event_id}</p>
            </div>
            <span className="text-xs text-[var(--text-secondary)] capitalize">{ev.provider}</span>
            <span className={cn('inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded truncate', statusStyle[ev.status] ?? statusStyle.pending)}>{ev.status}</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">{formatDate(ev.created_at)}</span>
            <span className="text-[10px] text-[var(--text-tertiary)] truncate" title={ev.error ?? ''}>{ev.error ? '⚠ erro' : '—'}</span>
          </div>
        ))}
      </div>
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">{page * limit + 1}–{Math.min((page + 1) * limit, total)} de {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => onPageChange(page - 1)} className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors">← Anterior</button>
            <button disabled={(page + 1) * limit >= total} onClick={() => onPageChange(page + 1)} className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors">Próximo →</button>
          </div>
        </div>
      )}
    </div>
  );
}
