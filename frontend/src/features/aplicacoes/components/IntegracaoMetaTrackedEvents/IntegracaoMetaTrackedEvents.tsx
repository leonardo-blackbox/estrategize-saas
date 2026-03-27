interface IntegracaoMetaTrackedEventsProps {
  leadEvent: 'start' | 'submit';
}

export function IntegracaoMetaTrackedEvents({ leadEvent }: IntegracaoMetaTrackedEventsProps) {
  return (
    <div className="px-3 py-2.5 rounded-xl text-[12px] text-[var(--text-secondary)]" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <p className="font-semibold text-[var(--text-primary)] mb-1.5">Eventos rastreados:</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30a0ff] flex-shrink-0" />
          <span>Visualização → <span className="font-mono text-[var(--accent)]">PageView</span></span>
        </div>
        {leadEvent === 'start' && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30a0ff] flex-shrink-0" />
            <span>Início → <span className="font-mono text-[var(--accent)]">Lead</span></span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] flex-shrink-0" />
          <span>
            Envio → <span className="font-mono text-[var(--accent)]">CompleteRegistration</span>
            {leadEvent === 'submit' && <span> + <span className="font-mono text-[var(--accent)]">Lead</span></span>}
          </span>
        </div>
      </div>
    </div>
  );
}
