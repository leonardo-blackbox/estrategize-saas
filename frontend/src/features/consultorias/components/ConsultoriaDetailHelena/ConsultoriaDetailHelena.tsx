import { Link } from 'react-router-dom';

interface ConsultoriaDetailHelenaProps {
  consultancyId: string;
}

export function ConsultoriaDetailHelena({ consultancyId: _ }: ConsultoriaDetailHelenaProps) {
  return (
    <div className="space-y-4">
      {/* Status */}
      <div
        className="rounded-[var(--radius-md)] p-4 flex items-center gap-3 border"
        style={{ background: 'rgba(124,92,252,0.05)', borderColor: 'rgba(124,92,252,0.2)' }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: '#a78bfa', boxShadow: '0 0 6px rgba(167,139,250,0.6)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Helena instalada. O painel aparece automaticamente quando uma reunião estiver ativa.
        </p>
      </div>

      {/* How it works */}
      <div
        className="rounded-[var(--radius-md)] p-5 space-y-4 border border-[var(--border-hairline)] bg-[var(--bg-surface-1)]"
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como funciona</h3>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Ative o bot em "Reuniões" e entre na chamada com a cliente.' },
            { step: '2', text: 'A Helena monitora a transcrição em tempo real.' },
            { step: '3', text: 'Um painel lateral aparece com sugestões de abordagem a cada janela da conversa.' },
            { step: '4', text: 'Ao detectar objeções ou sinais de fechamento, ela alerta imediatamente.' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5"
                style={{ background: 'rgba(124,92,252,0.15)', color: '#a78bfa' }}
              >
                {step}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
        <Link
          to="/admin/plugins/helena"
          className="hover:text-[var(--text-secondary)] transition-colors"
          style={{ color: '#a78bfa' }}
        >
          Configurar base de conhecimento →
        </Link>
        <span className="opacity-40">·</span>
        <Link
          to="/admin/plugins/helena"
          className="hover:text-[var(--text-secondary)] transition-colors"
        >
          Testar Helena
        </Link>
      </div>
    </div>
  );
}
