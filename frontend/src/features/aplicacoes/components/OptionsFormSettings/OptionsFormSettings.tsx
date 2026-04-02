import { cn } from '../../../../lib/cn.ts';
import { OptionsSection } from '../OptionsSection/index.ts';
import { OptionsToggleField } from '../OptionsToggleField/index.ts';
import type { FormSettings } from '../../../../api/applications.ts';

interface OptionsFormSettingsProps {
  settings: Partial<FormSettings>;
  onUpdate: (updates: Partial<FormSettings>) => void;
}

export function OptionsFormSettings({ settings, onUpdate }: OptionsFormSettingsProps) {
  return (
    <OptionsSection title="Configuracoes do formulario">
      <div className="space-y-1">
        <OptionsToggleField
          label="Mostrar barra de progresso"
          value={settings.showProgressBar ?? true}
          onChange={(v) => onUpdate({ showProgressBar: v })}
        />
        <OptionsToggleField
          label="Mostrar numeracao das perguntas"
          value={settings.showQuestionNumbers ?? true}
          onChange={(v) => onUpdate({ showQuestionNumbers: v })}
        />
        <OptionsToggleField
          label="Limitar uma resposta por sessao"
          value={settings.limitOneResponsePerSession ?? false}
          onChange={(v) => onUpdate({ limitOneResponsePerSession: v })}
        />
        <OptionsToggleField
          label="Mostrar marca d'agua"
          value={settings.showBranding ?? true}
          onChange={(v) => onUpdate({ showBranding: v })}
        />
      </div>

      <div className="space-y-3 mt-4">
        <div>
          <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">
            URL de redirecionamento apos envio
          </label>
          <input
            type="url"
            value={settings.redirectUrl ?? ''}
            onChange={(e) => onUpdate({ redirectUrl: e.target.value || undefined })}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-[13px]',
              'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none focus:border-[var(--accent)] transition-colors',
            )}
            placeholder="https://exemplo.com/obrigado"
          />
        </div>
        <div>
          <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">
            Fechar apos X respostas <span className="text-[var(--text-tertiary)]">(0 = sem limite)</span>
          </label>
          <input
            type="number"
            value={settings.closeAfterResponses ?? ''}
            onChange={(e) => onUpdate({ closeAfterResponses: e.target.value ? Number(e.target.value) : undefined })}
            min={0}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-[13px]',
              'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none focus:border-[var(--accent)] transition-colors',
            )}
            placeholder="Sem limite"
          />
        </div>
      </div>
    </OptionsSection>
  );
}
