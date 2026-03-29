import { useState } from 'react';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { type Oferta } from '../../../../api/courses.ts';

export interface OfertaFormData {
  name: string;
  type: 'one-time' | 'subscription';
  price_display: string;
}

interface OfertaFormModalProps {
  oferta?: Oferta;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: OfertaFormData) => void;
}

export function OfertaFormModal({ oferta, isSaving, onClose, onSubmit }: OfertaFormModalProps) {
  const [form, setForm] = useState<OfertaFormData>({
    name: oferta?.name ?? '',
    type: (oferta?.type ?? 'one-time') as 'one-time' | 'subscription',
    price_display: oferta?.price_display ?? '',
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return; }
    onSubmit(form);
  };

  return (
    <Modal open onClose={onClose} className="sm:max-w-xs">
      <div className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{oferta ? 'Editar oferta' : 'Nova oferta'}</h2>
        <Input label="Nome da oferta" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Plano Pro" />
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Tipo</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'one-time' | 'subscription' }))}
            className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]">
            <option value="one-time">Pagamento único</option>
            <option value="subscription">Assinatura</option>
          </select>
        </div>
        <Input label="Preço (exibição)" value={form.price_display ?? ''} onChange={(e) => setForm((f) => ({ ...f, price_display: e.target.value }))} placeholder="Ex: R$ 197/mês" />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Salvando...' : (oferta ? 'Salvar' : 'Criar')}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
