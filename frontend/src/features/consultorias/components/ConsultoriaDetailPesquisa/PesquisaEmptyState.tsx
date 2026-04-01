interface Props {
  onStart: () => Promise<void>;
  isStarting: boolean;
  creditsCost: number;
}

export function PesquisaEmptyState({ onStart, isStarting, creditsCost }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex items-center justify-center text-3xl">
        🔍
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Pesquisa Profunda de Mercado</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
          Descubra seus concorrentes locais, analise o mercado e receba um relatorio estrategico completo.
        </p>
      </div>
      <ul className="text-left space-y-1.5 text-sm text-[var(--text-secondary)]">
        <li>🗺 Google Maps — concorrentes locais</li>
        <li>📱 Instagram — analise de perfis</li>
        <li>🌐 Sites — presenca digital</li>
        <li>🤖 IA — relatorio estrategico</li>
      </ul>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #7c5cfc, #a855f7)' }}
        >
          {isStarting ? 'Iniciando...' : 'Iniciar Pesquisa'}
        </button>
        <p className="text-xs text-[var(--text-tertiary)]">
          {creditsCost === 0 ? 'Gratuito' : `Custa ${creditsCost} creditos`}
        </p>
      </div>
    </div>
  );
}
