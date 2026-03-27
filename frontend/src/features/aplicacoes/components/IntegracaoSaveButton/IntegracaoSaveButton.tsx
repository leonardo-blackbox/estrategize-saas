import { cn } from '../../../../lib/cn.ts';

interface IntegracaoSaveButtonProps {
  isSaving: boolean;
  isSaved: boolean;
  onSave: () => void;
  labelDefault: string;
}

export function IntegracaoSaveButton({ isSaving, isSaved, onSave, labelDefault }: IntegracaoSaveButtonProps) {
  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={cn(
        'w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        isSaved
          ? 'bg-[rgba(48,209,88,0.12)] text-[#30d158] border border-[rgba(48,209,88,0.25)]'
          : 'bg-[var(--accent)] text-white hover:opacity-90',
      )}
    >
      {isSaving ? 'Salvando...' : isSaved ? '✓ Salvo' : labelDefault}
    </button>
  );
}
