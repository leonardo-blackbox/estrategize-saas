export function IntegracaoMetaTestGuide() {
  return (
    <>
      <EventLayersInfo />
      <TestSteps />
      <DebugTip />
    </>
  );
}

function EventLayersInfo() {
  const layers = [
    { layer: 'SDK (fbevents.js)', desc: 'Pixel padrão do Meta. Pode ser bloqueado por ad blockers.', color: '#7c5cfc' },
    { layer: 'Image pixel', desc: 'Disparo via imagem de 1px. Funciona mesmo sem o SDK carregar.', color: '#30a0ff' },
    { layer: 'Server-side', desc: 'Enviado pelo nosso servidor. Não é bloqueável por extensões do navegador.', color: '#30d158' },
  ];

  return (
    <div>
      <p className="text-[11px] font-semibold text-[var(--text-primary)] mb-2">Como os eventos são enviados:</p>
      <div className="space-y-1.5">
        {layers.map((l) => (
          <div key={l.layer} className="flex items-start gap-2">
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: l.color }} />
            <span className="text-[11px] text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{l.layer}:</strong> {l.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestSteps() {
  const steps = [
    <>Salve o rastreamento com o ID do pixel preenchido e toggle{' '}<strong className="text-[var(--text-primary)]">ativo</strong>.</>,
    <>Clique em <strong className="text-[var(--text-primary)]">"Testar pixel agora"</strong>. Abre o Gerenciador de Eventos e o formulário ao mesmo tempo.</>,
    <>No Gerenciador, vá em <strong className="text-[var(--text-primary)]">Test Events</strong>{' '}e cole a URL do formulário. Preencha e envie. Eventos aparecem em tempo real.</>,
    <>Se não aparecer em <em>Test Events</em>, verifique a aba{' '}<strong className="text-[var(--text-primary)]">Overview → All Activity</strong>{' '}— eventos server-side aparecem ali (com 5-15min de delay).</>,
  ];

  return (
    <ol className="space-y-2.5 text-[12px] text-[var(--text-secondary)] list-none">
      {steps.map((content, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: 'var(--accent)', color: '#fff' }}>
            {i + 1}
          </span>
          <span>{content}</span>
        </li>
      ))}
    </ol>
  );
}

function DebugTip() {
  return (
    <div className="flex gap-2 px-3 py-2.5 rounded-lg text-[11px] text-[var(--text-secondary)]" style={{ background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.2)' }}>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-[#ffcc00] flex-shrink-0 mt-0.5">
        <path d="M8 1.5a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 8 1.5ZM8 5a.75.75 0 1 1 0 1.5A.75.75 0 0 1 8 5Zm-.75 2.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Z" fill="currentColor" />
      </svg>
      <span>
        <strong className="text-[var(--text-primary)]">Debug:</strong> Abra o formulário e aperte <strong className="text-[var(--text-primary)]">F12 → Console</strong>. Mensagens com prefixo <code className="font-mono">[pixel]</code> mostram exatamente o que está acontecendo. Se ver{' '}<code className="font-mono text-[#30d158]">[pixel] fbq → CompleteRegistration</code>{' '}o SDK funcionou. Se não ver, use a aba <em>Network</em> para verificar se{' '}<code className="font-mono">fbevents.js</code> foi bloqueado — mesmo assim, o envio server-side garante que o evento chegue ao Meta.
      </span>
    </div>
  );
}
