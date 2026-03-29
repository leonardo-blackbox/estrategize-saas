import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { cn } from '../../../../lib/cn.ts';
import { adminGetWebhookEvents, adminGetAuditLogs } from '../../../../api/courses.ts';
import { WebhooksTab } from './WebhooksTab.tsx';
import { AuditTab } from './AuditTab.tsx';

type Tab = 'webhooks' | 'audit';

const STATUS_STYLE: Record<string, string> = {
  processed: 'text-emerald-400 bg-emerald-400/10',
  failed: 'text-red-400 bg-red-400/10',
  processing: 'text-amber-400 bg-amber-400/10',
  pending: 'text-amber-400/70 bg-amber-400/5',
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
        <motion.div variants={staggerItem}>
          <WebhooksTab
            webhooks={webhooks}
            total={webhookTotal}
            page={webhookPage}
            limit={limit}
            isLoading={wLoading}
            statusFilter={statusFilter}
            providerFilter={providerFilter}
            onPageChange={setWebhookPage}
            onStatusFilter={setStatusFilter}
            onProviderFilter={setProviderFilter}
            formatDate={formatDate}
            statusStyle={STATUS_STYLE}
          />
        </motion.div>
      )}

      {tab === 'audit' && (
        <motion.div variants={staggerItem}>
          <AuditTab
            logs={auditLogs}
            total={auditTotal}
            page={auditPage}
            limit={limit}
            isLoading={aLoading}
            onPageChange={setAuditPage}
            formatDate={formatDate}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
