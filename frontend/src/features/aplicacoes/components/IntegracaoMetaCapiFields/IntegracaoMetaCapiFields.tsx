interface IntegracaoMetaCapiFieldsProps {
  accessToken: string;
  onAccessTokenChange: (v: string) => void;
  testEventCode: string;
  onTestEventCodeChange: (v: string) => void;
  showToken: boolean;
  onToggleShowToken: () => void;
}

export function IntegracaoMetaCapiFields({ accessToken, onAccessTokenChange, testEventCode, onTestEventCodeChange, showToken, onToggleShowToken }: IntegracaoMetaCapiFieldsProps) {
  return (
    <div className="p-3 rounded-xl space-y-2.5" style={{ background: 'var(--bg-surface-1)', border: '1px solid rgba(124,92,252,0.25)' }}>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Access Token</label>
        <div className="flex gap-1">
          <input type={showToken ? 'text' : 'password'} value={accessToken} onChange={(e) => onAccessTokenChange(e.target.value)} placeholder="EAAxxxxx..."
            className="flex-1 bg-[var(--bg-base)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] px-2.5 py-1.5 rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
            style={{ border: '1px solid var(--border-hairline)' }} autoComplete="off" />
          <button type="button" onClick={onToggleShowToken}
            className="px-2.5 py-1.5 rounded-lg text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-base)]"
            style={{ border: '1px solid var(--border-hairline)' }}>
            {showToken ? 'Ocultar' : 'Revelar'}
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Gerenciador de Eventos → Conjuntos de dados → Configurações → API de Conversões → Gerar token.</p>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
          Test Event Code <span className="font-normal text-[var(--text-tertiary)]">— opcional</span>
        </label>
        <input type="text" value={testEventCode} onChange={(e) => onTestEventCodeChange(e.target.value)} placeholder="TEST12345"
          className="w-full bg-[var(--bg-base)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] px-2.5 py-1.5 rounded-lg outline-none focus:border-[var(--accent)] transition-colors"
          style={{ border: '1px solid var(--border-hairline)' }} />
        <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Gerenciador de Eventos → Teste de Eventos. Remova após validar.</p>
      </div>
    </div>
  );
}
