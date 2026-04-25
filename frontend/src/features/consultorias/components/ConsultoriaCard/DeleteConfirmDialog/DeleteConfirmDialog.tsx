import { useState, useEffect } from 'react';
import { Modal } from '../../../../../components/ui/Modal.tsx';

interface DeleteConfirmDialogProps {
  open: boolean;
  clientName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({ open, clientName, onClose, onConfirm }: DeleteConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const confirmed = typed === clientName;

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Confirmar exclusão" size="sm" persistent>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Excluir consultoria
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Esta ação é permanente e não pode ser desfeita. Para confirmar, digite o nome exato da cliente:
          </p>
        </div>

        <div
          className="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold text-center"
          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-primary)' }}
        >
          {clientName}
        </div>

        <input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirmed && onConfirm()}
          placeholder="Digite o nome da cliente..."
          className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-sm outline-none transition-colors"
          style={{
            background: 'var(--bg-surface-1)',
            border: `1px solid ${confirmed ? 'var(--accent)' : 'var(--border-default)'}`,
            color: 'var(--text-primary)',
          }}
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className="px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-all"
            style={{
              background: confirmed ? '#ef4444' : 'var(--bg-surface-2)',
              color: confirmed ? '#fff' : 'var(--text-muted)',
              cursor: confirmed ? 'pointer' : 'not-allowed',
              opacity: confirmed ? 1 : 0.6,
            }}
          >
            Excluir permanentemente
          </button>
        </div>
      </div>
    </Modal>
  );
}
