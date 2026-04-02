import { cn } from '../../../../lib/cn.ts';
import { OptionsSection } from '../OptionsSection/index.ts';

interface OptionsDangerZoneProps {
  isDeleting: boolean;
  onDelete: () => void;
}

export function OptionsDangerZone({ isDeleting, onDelete }: OptionsDangerZoneProps) {
  function handleDelete() {
    if (confirm('Tem certeza? Esta acao nao pode ser desfeita. Todos os campos e respostas serao removidos permanentemente.')) {
      onDelete();
    }
  }

  return (
    <OptionsSection title="Zona perigosa">
      <div className={cn('rounded-xl border border-red-500/20 p-4', 'bg-red-500/5')}>
        <h4 className="text-[13px] font-semibold text-red-400 mb-1">Excluir formulario</h4>
        <p className="text-[12px] text-[var(--text-secondary)] mb-3">
          Acao permanente. Todos os campos e respostas serao removidos.
        </p>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
        >
          {isDeleting ? 'Excluindo...' : 'Excluir formulario'}
        </button>
      </div>
    </OptionsSection>
  );
}
