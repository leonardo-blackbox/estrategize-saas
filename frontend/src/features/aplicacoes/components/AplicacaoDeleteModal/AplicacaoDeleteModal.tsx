import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';

interface AplicacaoDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function AplicacaoDeleteModal({ open, onClose, onConfirm, isLoading }: AplicacaoDeleteModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">
            Excluir aplicação
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            Esta ação é permanente. Todas as respostas coletadas também serão removidas. Tem certeza?
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isLoading ? 'Excluindo…' : 'Excluir'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
