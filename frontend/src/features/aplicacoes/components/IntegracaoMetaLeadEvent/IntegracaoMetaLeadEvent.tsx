import { cn } from '../../../../lib/cn.ts';

interface IntegracaoMetaLeadEventProps {
  leadEvent: 'start' | 'submit';
  onLeadEventChange: (v: 'start' | 'submit') => void;
}

export function IntegracaoMetaLeadEvent({ leadEvent, onLeadEventChange }: IntegracaoMetaLeadEventProps) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <p className="text-[12px] font-semibold text-[var(--text-primary)] mb-2">
        Quando disparar o evento <span className="font-mono text-[var(--accent)]">Lead</span>?
      </p>
      <div className="flex gap-2">
        {(['start', 'submit'] as const).map((opt) => (
          <button key={opt} type="button" onClick={() => onLeadEventChange(opt)}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-[12px] font-medium transition-all border',
              leadEvent === opt
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'text-[var(--text-secondary)] border-[var(--border-hairline)] hover:border-[var(--accent)]',
            )}>
            {opt === 'start' ? 'Início do formulário' : 'Fim do formulário'}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
        {leadEvent === 'start'
          ? 'Lead dispara quando o usuário clica em "Começar". Útil para medir intenção.'
          : 'Lead dispara após o envio completo. Recomendado para qualidade de lead.'}
      </p>
    </div>
  );
}
