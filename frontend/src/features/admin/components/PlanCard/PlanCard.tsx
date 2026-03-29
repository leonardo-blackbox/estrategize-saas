import { type StripeProduct } from '../../../../api/stripe.ts';

export interface PlanCardProps {
  plan: StripeProduct;
  onEdit: (plan: StripeProduct) => void;
  onArchive: (id: string) => void;
  isArchiving: boolean;
}

const INTERVAL_LABEL: Record<StripeProduct['billing_interval'], string> = {
  month: 'mensal',
  year: 'anual',
  one_time: 'unico',
};

export function PlanCard({ plan, onEdit, onArchive, isArchiving }: PlanCardProps) {
  const price = (plan.price_cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{plan.name}</p>
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            plan.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
          }`}
        >
          {plan.status === 'active' ? 'Ativo' : 'Arquivado'}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-base font-semibold text-[var(--text-primary)]">{price}</p>
        <span className="text-xs text-[var(--text-tertiary)]">/ {INTERVAL_LABEL[plan.billing_interval]}</span>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">{plan.credits} creditos</p>

      {plan.description && (
        <p className="text-xs text-[var(--text-tertiary)] line-clamp-2">{plan.description}</p>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={() => onEdit(plan)}
          className="flex-1 text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => onArchive(plan.id)}
          disabled={plan.status === 'archived' || isArchiving}
          className="flex-1 text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-hairline)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Arquivar
        </button>
      </div>
    </div>
  );
}
