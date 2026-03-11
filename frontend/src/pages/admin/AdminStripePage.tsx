import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { adminGetWebhookEvents, adminGetAuditLogs } from '../../api/courses.ts';

type Tab = 'webhooks' | 'audit';

const STATUS_STYLE: Record<string, string> = {
  processed: 'text-[var(--text-primary)] bg-[var(--bg-hover)]',
  failed: 'text-[var(--text-tertiary)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
  processing: 'text-[var(--text-secondary)] bg-[var(--bg-hover)]',
  pending: 'text-[var(--text-tertiary)] bg-[var(--bg-hover)]',
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function AdminStripePage() {
  const [tab, setTab] = useState<Tab>('webhooks');
  const [webhookPage, setWebhookPage] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const limit = 25;

  const { data: webhooksData, isLoading: wLoading } = useQuery({
    queryKey: ['admin-webhooks', webhookPage, statusFilter, providerFilter],
    queryFn: () => adminGetWebhookEvents({
      limit,
      offset: webhookPage * limit,
      status: statusFilter || undefined,
      provider: providerFilter || undefined,
    }),
    enabled: tab === 'webhooks',
  });

  const { data: auditData, isLoading: aLoading } = useQuery({
    queryKey: ['admin-audit', auditPage],
    queryFn: () => adminGetAuditLogs({ limit, offset: auditPage * limit }),
    enabled: tab === 'audit',
  });

  const webhooks = (webhooksData as any)?.data ?? [];
  const webhookTotal = (webhooksData as any)?.count ?? 0;
  const auditLogs = (auditData as any)?.data ?? [];
  const auditTotal = (auditData as any)?.count ?? 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-5"
    >
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Webhooks & Auditoria</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Eventos recebidos e ações administrativas.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem} className="flex gap-1 border-b border-[var(--border-hairline)]">
        {(['webhooks', 'audit'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
              tab === t
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
            )}
          >
            {t === 'webhooks' ? 'Webhook Events' : 'Audit Log'}
          </button>
        ))}
      </motion.div>

      {tab === 'webhooks' && (
        <motion.div variants={staggerItem} className="space-y-3">
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setWebhookPage(0); }}
              className="text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-2 py-1.5 text-[var(--text-secondary)] focus:outline-none"
            >
              <option value="">Todos status</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); setWebhookPage(0); }}
              className="text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-2 py-1.5 text-[var(--text-secondary)] focus:outline-none"
            >
              <option value="">Todos providers</option>
              <option value="stripe">Stripe</option>
              <option value="hotmart">Hotmart</option>
              <option value="kiwify">Kiwify</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_100px_140px_80px] gap-x-3 px-4 py-2 border-b border-[var(--border-hairline)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <span>Tipo / ID</span>
              <span>Provider</span>
              <span>Status</span>
              <span>Data</span>
              <span>Erro</span>
            </div>

            {wLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse border-b border-[var(--border-hairline)] last:border-0 bg-[var(--bg-surface-1)]" />
              ))
            ) : webhooks.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Nenhum evento encontrado.</p>
              </div>
            ) : (
              webhooks.map((ev: any) => (
                <div
                  key={ev.id}
                  className="grid grid-cols-[1fr_100px_100px_140px_80px] gap-x-3 items-center px-4 py-3 border-b border-[var(--border-hairline)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{ev.event_type}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono truncate">{ev.event_id}</p>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] capitalize">{ev.provider}</span>
                  <span className={cn(
                    'inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded truncate',
                    STATUS_STYLE[ev.status] ?? STATUS_STYLE.pending,
                  )}>
                    {ev.status}
                  </span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">{formatDate(ev.created_at)}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] truncate" title={ev.error ?? ''}>
                    {ev.error ? '⚠ erro' : '—'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {webhookTotal > limit && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-tertiary)]">
                {webhookPage * limit + 1}–{Math.min((webhookPage + 1) * limit, webhookTotal)} de {webhookTotal}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={webhookPage === 0}
                  onClick={() => setWebhookPage((p) => p - 1)}
                  className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  disabled={(webhookPage + 1) * limit >= webhookTotal}
                  onClick={() => setWebhookPage((p) => p + 1)}
                  className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {tab === 'audit' && (
        <motion.div variants={staggerItem} className="space-y-3">
          <div className="rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] overflow-hidden">
            <div className="grid grid-cols-[140px_1fr_160px] gap-x-3 px-4 py-2 border-b border-[var(--border-hairline)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              <span>Ação</span>
              <span>Detalhes</span>
              <span>Data</span>
            </div>

            {aLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse border-b border-[var(--border-hairline)] last:border-0" />
              ))
            ) : auditLogs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Nenhuma ação registrada.</p>
              </div>
            ) : (
              auditLogs.map((log: any) => (
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

          {auditTotal > limit && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--text-tertiary)]">
                {auditPage * limit + 1}–{Math.min((auditPage + 1) * limit, auditTotal)} de {auditTotal}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={auditPage === 0}
                  onClick={() => setAuditPage((p) => p - 1)}
                  className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  disabled={(auditPage + 1) * limit >= auditTotal}
                  onClick={() => setAuditPage((p) => p + 1)}
                  className="text-xs px-2 py-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-40 transition-colors"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
