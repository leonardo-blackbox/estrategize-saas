import { cn } from '../../../../lib/cn.ts';

interface OptionsSaveBarProps {
  isSaving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function OptionsSaveBar({ isSaving, onDiscard, onSave }: OptionsSaveBarProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 -mx-6 px-6 py-3 mb-6',
        'flex items-center justify-between',
        'bg-[var(--bg-surface-2)] border-b border-[var(--border-hairline)]',
      )}
    >
      <span className="text-[13px] text-[var(--text-secondary)]">
        Voce tem alteracoes nao salvas.
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onDiscard}
          className="px-3 py-1.5 rounded-lg text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors active:scale-[0.97]"
        >
          Descartar
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-1.5 rounded-lg text-[13px] font-semibold bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
        >
          {isSaving ? 'Salvando...' : 'Salvar alteracoes'}
        </button>
      </div>
    </div>
  );
}
