import { Button } from '../../../../components/ui/Button.tsx';

interface ConsultoriasEmptyStateProps {
  hasSearch: boolean;
  onCreateClick: () => void;
}

export function ConsultoriasEmptyState({ hasSearch, onCreateClick }: ConsultoriasEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex items-center justify-center">
        <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </div>
      <div className="max-w-xs">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {hasSearch ? 'Nenhum resultado para este filtro.' : 'Sua base de clientes, centralizada.'}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-relaxed">
          {hasSearch
            ? 'Tente outro termo ou ajuste os filtros de etapa e status.'
            : 'Acompanhe progresso, próximas reuniões e prioridades de todos os seus clientes em um só lugar.'}
        </p>
      </div>
      {!hasSearch && (
        <Button size="sm" onClick={onCreateClick}>
          Criar primeira consultoria
        </Button>
      )}
    </div>
  );
}
