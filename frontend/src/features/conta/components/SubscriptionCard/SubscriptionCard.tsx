import { Link } from 'react-router-dom';
import { cn } from '../../../../lib/cn.ts';
import type { SubscriptionData } from '../../services/account.api.ts';

interface SubscriptionCardProps {
  subscription: SubscriptionData | null | undefined;
  isLoading: boolean;
  onManage: () => void;
  isManaging: boolean;
}

const STATUS_LABELS: Record<SubscriptionData['status'], string> = { active: 'Ativo', canceled: 'Cancelado', past_due: 'Em atraso', trialing: 'Período de teste' };
const STATUS_CLASSES: Record<SubscriptionData['status'], string> = { active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', canceled: 'bg-red-500/10 text-red-600 dark:text-red-400', past_due: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', trialing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' };
const formatDate = (iso: string) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

export function SubscriptionCard({ subscription, isLoading, onManage, isManaging }: SubscriptionCardProps) {
  const cardClass = cn('rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] transition-colors duration-[var(--duration-normal)]');

  if (isLoading) {
    return (
      <div className={cardClass} aria-busy="true">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-1/3 rounded bg-[var(--bg-surface-2)]" />
          <div className="h-3 w-1/2 rounded bg-[var(--bg-surface-2)]" />
          <div className="h-3 w-2/5 rounded bg-[var(--bg-surface-2)]" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-[var(--text-tertiary)]">Voce ainda nao possui um plano ativo.</p>
        <Link to="/planos" className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:opacity-80 transition-opacity">Ver planos disponiveis</Link>
      </div>
    );
  }

  const periodDate = subscription.current_period_end ? formatDate(subscription.current_period_end) : null;

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{subscription.plan_name}</p>
          <span className={cn('inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full', STATUS_CLASSES[subscription.status])}>{STATUS_LABELS[subscription.status]}</span>
          {periodDate && (
            <p className={cn('text-xs font-medium', subscription.cancel_at_period_end ? 'text-amber-500' : 'text-[var(--text-tertiary)]')}>
              {subscription.cancel_at_period_end ? `Cancela em ${periodDate}` : `Renova em ${periodDate}`}
            </p>
          )}
          <p className="text-xs text-[var(--text-secondary)]">{subscription.credits_available} de {subscription.credits_per_month} creditos disponiveis</p>
        </div>
        <button type="button" onClick={onManage} disabled={isManaging} className={cn('shrink-0 text-sm font-medium px-3 py-1.5 rounded-full text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent-subtle)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5')}>
          {isManaging && <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
          Gerenciar assinatura
        </button>
      </div>
    </div>
  );
}
