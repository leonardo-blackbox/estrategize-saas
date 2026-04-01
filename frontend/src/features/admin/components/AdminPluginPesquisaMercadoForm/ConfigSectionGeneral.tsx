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
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${checked ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

export function ConfigSectionGeneral({ config, onChange, disabled }: Props) {
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Geral</h3>
      {!config.enabled && (
        <p className="text-xs text-amber-400 bg-amber-400/10 rounded px-3 py-2 mb-2">
          Plugin desabilitado. Scan de Instagram e pesquisa profunda estao bloqueados.
        </p>
      )}
      <Toggle
        label="Plugin habilitado"
        checked={config.enabled}
        onToggle={() => onChange({ enabled: !config.enabled })}
        disabled={disabled}
      />
      <Toggle
        label="Instagram Auto-Scan ativo"
        checked={config.instagram_scan_enabled}
        onToggle={() => onChange({ instagram_scan_enabled: !config.instagram_scan_enabled })}
        disabled={disabled}
      />
    </section>
  );
}
