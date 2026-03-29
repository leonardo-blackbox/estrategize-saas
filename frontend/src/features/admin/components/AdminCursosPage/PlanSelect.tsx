import type { StripeProduct } from '../../../../api/stripe.ts';

interface PlanSelectProps {
  value: string | null | undefined;
  products: StripeProduct[];
  onChange: (planId: string | null) => void;
}

const SELECT_CLASS = 'w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)]';
const INTERVAL_LABEL: Record<string, string> = { month: 'mês', year: 'ano', one_time: 'único' };

export function PlanSelect({ value, products, onChange }: PlanSelectProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
        Plano associado
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={SELECT_CLASS}
      >
        <option value="">Nenhum (acesso livre)</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — R$ {(p.price_cents / 100).toFixed(2)}/{INTERVAL_LABEL[p.billing_interval] ?? p.billing_interval}
          </option>
        ))}
      </select>
    </div>
  );
}
