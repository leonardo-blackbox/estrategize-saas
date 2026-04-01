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

const SOURCES = [
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'instagram_search', label: 'Busca Instagram' },
] as const;

export function ConfigSectionDiscovery({ config, onChange, disabled }: Props) {
  function toggleSource(src: 'google_maps' | 'instagram_search') {
    const current = config.discovery_sources;
    const next = current.includes(src) ? current.filter((s) => s !== src) : [...current, src];
    if (next.length > 0) onChange({ discovery_sources: next });
  }

  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Descoberta de Concorrentes (Tier 2)</h3>
      <div className="py-2 space-y-1">
        <span className="text-sm text-[var(--text-secondary)]">Fontes de descoberta</span>
        <div className="flex gap-4 mt-1">
          {SOURCES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" disabled={disabled} checked={config.discovery_sources.includes(value)}
                onChange={() => toggleSource(value)}
                className="rounded border-[var(--border-default)] disabled:opacity-40" />
              <span className="text-sm text-[var(--text-secondary)]">{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <label className="text-sm text-[var(--text-secondary)]">Max concorrentes a descobrir</label>
        <select value={config.max_competitors_discover} disabled={disabled}
          onChange={(e) => onChange({ max_competitors_discover: Number(e.target.value) as typeof config.max_competitors_discover })}
          className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] disabled:opacity-40">
          {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between py-2">
        <label className="text-sm text-[var(--text-secondary)]">Max a analisar no Instagram</label>
        <select value={config.max_competitors_instagram} disabled={disabled}
          onChange={(e) => onChange({ max_competitors_instagram: Number(e.target.value) as typeof config.max_competitors_instagram })}
          className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] disabled:opacity-40">
          {[3, 5, 10, 20].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <Toggle label="Analisar sites dos concorrentes (Firecrawl)" checked={config.include_competitor_websites} onToggle={() => onChange({ include_competitor_websites: !config.include_competitor_websites })} disabled={disabled} />
      {config.include_competitor_websites && (
        <div className="flex items-center justify-between py-2 pl-4">
          <label className="text-sm text-[var(--text-secondary)]">Max de sites</label>
          <select value={config.max_websites_scrape} disabled={disabled}
            onChange={(e) => onChange({ max_websites_scrape: Number(e.target.value) as typeof config.max_websites_scrape })}
            className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] disabled:opacity-40">
            {[3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}
    </section>
  );
}
