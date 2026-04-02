import { cn } from '../../../../lib/cn.ts';
import { OptionsSection } from '../OptionsSection/index.ts';
import type { FormSettings } from '../../../../api/applications.ts';

interface OptionsThankYouSectionProps {
  settings: Partial<FormSettings>;
  onUpdate: (updates: Partial<FormSettings>) => void;
}

export function OptionsThankYouSection({ settings, onUpdate }: OptionsThankYouSectionProps) {
  return (
    <OptionsSection title="Mensagem de agradecimento" description="Exibida ao final do formulario.">
      <div className="space-y-3">
        <div>
          <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">Titulo</label>
          <input
            type="text"
            value={settings.thankYouTitle ?? ''}
            onChange={(e) => onUpdate({ thankYouTitle: e.target.value })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-[13px]',
              'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none focus:border-[var(--accent)] transition-colors',
            )}
            placeholder="Obrigado!"
          />
        </div>
        <div>
          <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">Mensagem</label>
          <textarea
            value={settings.thankYouMessage ?? ''}
            onChange={(e) => onUpdate({ thankYouMessage: e.target.value })}
            rows={3}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-[13px] resize-none',
              'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none focus:border-[var(--accent)] transition-colors',
            )}
            placeholder="Suas respostas foram recebidas."
          />
        </div>
      </div>
    </OptionsSection>
  );
}
