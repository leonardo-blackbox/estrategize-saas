import type { StripeProduct } from '../../../../api/stripe.ts';

interface CoursePlanSelectProps {
  currentPlanId: string | null;
  plans: StripeProduct[];
  onSelect: (planId: string | null) => void;
  isPending: boolean;
}

const SELECT_CLASS = 'rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50';
const INTERVAL_LABEL: Record<string, string> = { month: 'mês', year: 'ano', one_time: 'único' };

export function CoursePlanSelect({ currentPlanId, plans, onSelect, isPending }: CoursePlanSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[var(--text-tertiary)] shrink-0">Plano</label>
      <select
        value={currentPlanId ?? ''}
        onChange={(e) => onSelect(e.target.value || null)}
        disabled={isPending}
        className={SELECT_CLASS}
      >
        <option value="">Nenhum (acesso livre)</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — R$ {(p.price_cents / 100).toFixed(2)}/{INTERVAL_LABEL[p.billing_interval] ?? p.billing_interval}
          </option>
        ))}
      </select>
    </div>
  );
}
