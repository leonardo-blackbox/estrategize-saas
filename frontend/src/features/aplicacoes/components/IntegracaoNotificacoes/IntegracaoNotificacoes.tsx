import { cn } from '../../../../lib/cn.ts';
import { IntegracaoSaveButton } from '../IntegracaoSaveButton';

interface IntegracaoNotificacoesProps {
  emailEnabled: boolean;
  onEmailEnabledChange: (v: boolean) => void;
  emailTo: string;
  onEmailToChange: (v: string) => void;
  emailCc: string;
  onEmailCcChange: (v: string) => void;
  isSaving: boolean;
  isSaved: boolean;
  onSave: () => void;
}

export function IntegracaoNotificacoes({
  emailEnabled, onEmailEnabledChange,
  emailTo, onEmailToChange,
  emailCc, onEmailCcChange,
  isSaving, isSaved, onSave,
}: IntegracaoNotificacoesProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Notificações</h3>
        {emailEnabled && <span className="w-2 h-2 rounded-full bg-[#30d158] flex-shrink-0" title="Configurado" />}
      </div>
      <p className="text-[12px] text-[var(--text-secondary)] mb-4">
        Receba um e-mail cada vez que alguém preencher este formulário.
      </p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] text-[var(--text-primary)]">Notificar por e-mail</span>
        <button
          type="button" role="switch" aria-checked={emailEnabled}
          onClick={() => onEmailEnabledChange(!emailEnabled)}
          className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', emailEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--border-hairline)]')}
        >
          <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', emailEnabled ? 'translate-x-[18px]' : 'translate-x-1')} />
        </button>
      </div>

      {emailEnabled && (
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-[12px] text-[var(--text-secondary)] block mb-1">Enviar para</label>
            <input
              type="email" value={emailTo} onChange={(e) => onEmailToChange(e.target.value)} placeholder="seu@email.com"
              className={cn('w-full px-3 py-2 rounded-lg text-[13px]', 'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]', 'text-[var(--text-primary)] placeholder-[var(--text-tertiary)]', 'focus:outline-none focus:border-[var(--accent)] transition-colors')}
            />
          </div>
          <div>
            <label className="text-[12px] text-[var(--text-secondary)] block mb-1">CC (opcional)</label>
            <input
              type="email" value={emailCc} onChange={(e) => onEmailCcChange(e.target.value)} placeholder="outro@email.com"
              className={cn('w-full px-3 py-2 rounded-lg text-[13px]', 'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]', 'text-[var(--text-primary)] placeholder-[var(--text-tertiary)]', 'focus:outline-none focus:border-[var(--accent)] transition-colors')}
            />
          </div>
        </div>
      )}

      <IntegracaoSaveButton isSaving={isSaving} isSaved={isSaved} onSave={onSave} labelDefault="Salvar notificações" />
    </section>
  );
}
