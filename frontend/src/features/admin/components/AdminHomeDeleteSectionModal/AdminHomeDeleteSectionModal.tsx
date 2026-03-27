import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';

interface AdminHomeDeleteSectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function AdminHomeDeleteSectionModal({
  open, onClose, onConfirm, isPending,
}: AdminHomeDeleteSectionModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="sm:max-w-xs">
      <div className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Excluir secao?</h2>
        <p className="text-sm text-[var(--text-tertiary)]">
          Os cursos nao serao deletados, apenas removidos desta secao.
        </p>
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-red-500 hover:bg-red-400"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
