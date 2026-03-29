import { useState, useEffect } from 'react';
import { type CreateProductInput, type StripeProduct } from '../../../../api/stripe.ts';

export interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProductInput) => void;
  isSubmitting: boolean;
  editPlan?: StripeProduct | null;
}

export function PlanFormModal({ isOpen, onClose, onSubmit, isSubmitting, editPlan }: PlanFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [credits, setCredits] = useState('0');
  const [interval, setInterval] = useState<CreateProductInput['billing_interval']>('month');

  useEffect(() => {
    if (editPlan) {
      setName(editPlan.name);
      setDescription(editPlan.description ?? '');
      setPriceDisplay((editPlan.price_cents / 100).toFixed(2));
      setCredits(String(editPlan.credits));
      setInterval(editPlan.billing_interval);
    } else {
      setName(''); setDescription(''); setPriceDisplay(''); setCredits('0'); setInterval('month');
    }
  }, [editPlan, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const price_cents = Math.round(parseFloat(priceDisplay || '0') * 100);
    const creditsNum = Math.max(0, parseInt(credits, 10) || 0);
    onSubmit({ name: name.trim(), description: description.trim() || undefined, price_cents, credits: creditsNum, billing_interval: interval });
  }

  const inputClass = 'w-full text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--text-secondary)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--bg-base)] border border-[var(--border-hairline)] shadow-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {editPlan ? 'Editar Plano' : 'Novo Plano'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={inputClass} placeholder="Nome do plano" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className={inputClass} placeholder="Descricao (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className={inputClass} type="number" min="0" step="0.01" placeholder="Preco em R$ (ex: 97.00)" value={priceDisplay} onChange={(e) => setPriceDisplay(e.target.value)} />
          <input className={inputClass} type="number" min="0" step="1" placeholder="Creditos" value={credits} onChange={(e) => setCredits(e.target.value)} />
          <select className={inputClass} value={interval} onChange={(e) => setInterval(e.target.value as CreateProductInput['billing_interval'])}>
            <option value="month">Mensal</option>
            <option value="year">Anual</option>
            <option value="one_time">Pagamento Unico</option>
          </select>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 text-xs font-medium px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || !name.trim()} className="flex-1 text-xs font-semibold px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
              {isSubmitting ? 'Salvando...' : editPlan ? 'Salvar' : 'Criar Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
