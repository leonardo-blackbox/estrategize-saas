import type { PesquisaMercadoConfig } from '../../../../types/market-intelligence.ts';

interface Props {
  config: PesquisaMercadoConfig;
  onChange: (partial: Partial<PesquisaMercadoConfig>) => void;
  disabled?: boolean;
}

function Toggle({ label, checked, onToggle, disabled }: { label: string; checked: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={onToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${checked ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]'}`}>
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

export function ConfigSectionCredits({ config, onChange, disabled }: Props) {
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Creditos</h3>
      <div className="flex items-center justify-between py-2">
        <label className="text-sm text-[var(--text-secondary)]">Scan basico de Instagram</label>
        <div className="flex items-center gap-2">
          <input type="number" min={0} max={100} value={config.credits_cost_basic} disabled={disabled}
            onChange={(e) => onChange({ credits_cost_basic: Math.max(0, Math.min(100, Number(e.target.value))) })}
            className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] w-20 disabled:opacity-40" />
          <span className="text-xs text-[var(--text-tertiary)]">{config.credits_cost_basic === 0 ? '(gratuito)' : 'creditos'}</span>
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <label className="text-sm text-[var(--text-secondary)]">Pesquisa profunda</label>
        <div className="flex items-center gap-2">
          <input type="number" min={0} max={100} value={config.credits_cost_deep} disabled={disabled}
            onChange={(e) => onChange({ credits_cost_deep: Math.max(0, Math.min(100, Number(e.target.value))) })}
            className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] w-20 disabled:opacity-40" />
          <span className="text-xs text-[var(--text-tertiary)]">creditos</span>
        </div>
      </div>
      <Toggle label="Primeira pesquisa gratuita por consultoria" checked={config.free_first_research} onToggle={() => onChange({ free_first_research: !config.free_first_research })} disabled={disabled} />
      <p className="text-xs text-[var(--text-tertiary)] pt-1">
        Custo atual: {config.credits_cost_deep === 0 ? 'Gratuito' : `${config.credits_cost_deep} creditos`} por pesquisa profunda
        {config.free_first_research && config.credits_cost_deep > 0 && ' (primeira gratuita)'}
      </p>
    </section>
  );
}
