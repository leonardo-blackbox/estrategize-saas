import { useState } from 'react';
import type { PesquisaMercadoConfig, ReportSections } from '../../../../types/market-intelligence.ts';

interface Props {
  config: PesquisaMercadoConfig;
  onChange: (partial: Partial<PesquisaMercadoConfig>) => void;
  disabled?: boolean;
}

const SECTION_LABELS: Record<keyof ReportSections, string> = {
  market_overview: 'Panorama do Mercado',
  competitor_analysis: 'Analise de Concorrentes',
  social_media_analysis: 'Analise de Redes Sociais',
  digital_presence: 'Presenca Digital',
  opportunities: 'Oportunidades',
  threats: 'Ameacas e Riscos',
  positioning: 'Posicionamento Sugerido',
  action_plan: 'Plano de Acao',
};

export function ConfigSectionAIReport({ config, onChange, disabled }: Props) {
  const [promptLen, setPromptLen] = useState((config.custom_system_prompt ?? '').length);

  function toggleSection(key: keyof ReportSections) {
    onChange({ report_sections: { ...config.report_sections, [key]: !config.report_sections[key] } });
  }

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Relatorio IA</h3>
      <div className="flex items-center justify-between py-1">
        <label className="text-sm text-[var(--text-secondary)]">Idioma do relatorio</label>
        <select value={config.report_language} disabled={disabled}
          onChange={(e) => onChange({ report_language: e.target.value as typeof config.report_language })}
          className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] disabled:opacity-40">
          <option value="pt-BR">PT-BR</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="flex items-center justify-between py-1">
        <label className="text-sm text-[var(--text-secondary)]">Estilo do relatorio</label>
        <select value={config.report_style} disabled={disabled}
          onChange={(e) => onChange({ report_style: e.target.value as typeof config.report_style })}
          className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] disabled:opacity-40">
          <option value="executive">Executivo</option>
          <option value="detailed">Detalhado</option>
          <option value="action-focused">Orientado a Acao</option>
        </select>
      </div>
      <div className="py-1 space-y-1">
        <span className="text-sm text-[var(--text-secondary)]">Secoes do relatorio</span>
        <div className="grid grid-cols-2 gap-x-4 mt-1">
          {(Object.keys(SECTION_LABELS) as Array<keyof ReportSections>).map((key) => (
            <label key={key} className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" disabled={disabled} checked={config.report_sections[key]} onChange={() => toggleSection(key)}
                className="rounded border-[var(--border-default)] disabled:opacity-40" />
              <span className="text-xs text-[var(--text-secondary)]">{SECTION_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm text-[var(--text-secondary)]">Prompt personalizado (opcional)</label>
          <span className="text-xs text-[var(--text-tertiary)]">{promptLen}/3000</span>
        </div>
        <textarea
          value={config.custom_system_prompt ?? ''}
          disabled={disabled}
          maxLength={3000}
          rows={4}
          placeholder="Deixe vazio para usar o prompt padrao"
          onChange={(e) => { setPromptLen(e.target.value.length); onChange({ custom_system_prompt: e.target.value || null }); }}
          className="w-full text-sm bg-[var(--bg-surface-1)] text-[var(--text-primary)] rounded px-3 py-2 border border-[var(--border-default)] resize-y disabled:opacity-40 placeholder:text-[var(--text-muted)]"
        />
      </div>
      <div className="flex items-center justify-between py-1">
        <label className="text-sm text-[var(--text-secondary)]">Temperatura da IA</label>
        <select value={config.ai_temperature} disabled={disabled}
          onChange={(e) => onChange({ ai_temperature: Number(e.target.value) as typeof config.ai_temperature })}
          className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] disabled:opacity-40">
          <option value={0.3}>0.3 — Conservador</option>
          <option value={0.5}>0.5 — Balanceado</option>
          <option value={0.7}>0.7 — Criativo</option>
        </select>
      </div>
    </section>
  );
}
