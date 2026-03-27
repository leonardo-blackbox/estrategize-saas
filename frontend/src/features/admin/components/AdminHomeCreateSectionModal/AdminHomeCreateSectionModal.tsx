import { Modal } from '../../../../components/ui/Modal.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Button } from '../../../../components/ui/Button.tsx';

interface AdminHomeCreateSectionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  setTitle: (v: string) => void;
  onCreate: (title: string) => void;
  isPending: boolean;
}

export function AdminHomeCreateSectionModal({
  open, onClose, title, setTitle, onCreate, isPending,
}: AdminHomeCreateSectionModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="sm:max-w-xs">
      <div className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Nova secao</h2>
        <Input
          label="Nome da secao"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Bonus, Masterclasses..."
          onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) onCreate(title.trim()); }}
        />
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => { if (title.trim()) onCreate(title.trim()); }}
            disabled={!title.trim() || isPending}
          >
            {isPending ? 'Criando...' : 'Criar'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
