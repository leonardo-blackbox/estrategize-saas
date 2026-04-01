import type { HelenaConfig } from '../../../../api/adminHelena.ts';

interface HelenaWindowConfigSectionProps {
  config: HelenaConfig | undefined;
  isLoading: boolean;
  onToggle: (key: string, value: boolean) => void;
  onIntervalChange: (minutes: number) => void;
  isSaving: boolean;
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button role="switch" aria-checked={on} disabled={disabled} onClick={onClick}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed ${on ? 'bg-violet-600' : 'bg-[var(--border-hairline)]'}`}>
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

const WINDOWS = [
  { key: 'opening_enabled', label: 'Abertura', desc: 'Sugestoes nos primeiros 5 minutos' },
  { key: 'mid_enabled', label: 'Meio', desc: (m: number) => `Sugestoes a cada ${m} minutos` },
  { key: 'closing_enabled', label: 'Fechamento', desc: 'Sugestoes nos ultimos 10 minutos' },
  { key: 'objection_enabled', label: 'Objecao', desc: 'Alerta imediato ao detectar linguagem de resistencia' },
] as const;

export function HelenaWindowConfigSection({ config, isLoading, onToggle, onIntervalChange, isSaving }: HelenaWindowConfigSectionProps) {
  const disabled = isLoading || isSaving;
  const mid = config?.mid_interval_minutes ?? 10;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Configuracao de Janelas</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Controle quando a Helena intervem durante a reuniao.</p>
      </div>
      <div className="divide-y divide-[var(--border-hairline)]">
        {WINDOWS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-[var(--text-primary)]">{label}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{typeof desc === 'function' ? desc(mid) : desc}</p>
            </div>
            <Toggle on={config?.[key] ?? true} onClick={() => onToggle(key, !(config?.[key] ?? true))} disabled={disabled} />
          </div>
        ))}
        {config?.mid_enabled && (
          <div className="flex items-center justify-between gap-4 py-3">
            <p className="text-xs text-[var(--text-tertiary)]">Intervalo entre sugestoes de meio</p>
            <select value={mid} disabled={disabled} onChange={(e) => onIntervalChange(Number(e.target.value))}
              className="rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-50">
              {[5, 10, 15, 20].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
