import { type PublicPlan } from '../../../../api/plans.ts';

export interface PlanCardProps {
  plan: PublicPlan;
  onSubscribe: (planId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const INTERVAL_LABEL: Record<PublicPlan['billing_interval'], string> = {
  month: 'Mensal',
  year: 'Anual',
  one_time: 'Pagamento Unico',
};

const CREDITS_SUFFIX: Record<PublicPlan['billing_interval'], string> = {
  month: '/mes',
  year: '/ano',
  one_time: '',
};

function formatPrice(priceCents: number, interval: PublicPlan['billing_interval']): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceCents / 100);

  const suffix = interval === 'month' ? '/mes' : interval === 'year' ? '/ano' : ' (unico)';
  return `${formatted}${suffix}`;
}

export function PlanCard({ plan, onSubscribe, isLoading, error }: PlanCardProps) {
  const [priceBase, priceSuffix] = formatPrice(plan.price_cents, plan.billing_interval).split(
    /(\/mes|\/ano| \(unico\))$/
  );
  const creditsSuffix = CREDITS_SUFFIX[plan.billing_interval];

  return (
    <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 flex flex-col gap-4">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {INTERVAL_LABEL[plan.billing_interval]}
        </span>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-1">{plan.name}</h3>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[var(--text-primary)]">{priceBase}</span>
        {priceSuffix && (
          <span className="text-sm font-normal text-[var(--text-secondary)]">{priceSuffix}</span>
        )}
      </div>

      <p className="text-sm text-[var(--text-secondary)]">
        {plan.credits} creditos{creditsSuffix}
      </p>

      {plan.description && (
        <p className="text-sm text-[var(--text-tertiary)]">{plan.description}</p>
      )}

      <button
        onClick={() => onSubscribe(plan.id)}
        disabled={isLoading}
        className={`mt-auto w-full rounded-lg bg-[#7c5cfc] hover:bg-[#6b4ee0] text-white font-medium py-3 px-4 transition-colors${isLoading ? ' opacity-60 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Processando...' : 'Assinar'}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
