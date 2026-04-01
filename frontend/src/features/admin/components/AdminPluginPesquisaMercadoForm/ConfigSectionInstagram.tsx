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

const POST_COUNT_OPTIONS = [6, 12, 24, 48] as const;

export function ConfigSectionInstagram({ config, onChange, disabled }: Props) {
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Scan Instagram (Tier 1)</h3>
      <div className="flex items-center justify-between py-2">
        <label className="text-sm text-[var(--text-secondary)]">Posts a buscar</label>
        <select
          value={config.instagram_posts_count}
          disabled={disabled}
          onChange={(e) => onChange({ instagram_posts_count: Number(e.target.value) as typeof config.instagram_posts_count })}
          className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] disabled:opacity-40"
        >
          {POST_COUNT_OPTIONS.map((n) => <option key={n} value={n}>{n} posts</option>)}
        </select>
      </div>
      <Toggle label="Calcular taxa de engajamento" checked={config.instagram_engagement_rate} onToggle={() => onChange({ instagram_engagement_rate: !config.instagram_engagement_rate })} disabled={disabled} />
      <Toggle label="Calcular frequencia de posts" checked={config.instagram_posting_frequency} onToggle={() => onChange({ instagram_posting_frequency: !config.instagram_posting_frequency })} disabled={disabled} />
      <Toggle label="Analise de hashtags" checked={config.instagram_hashtag_analysis} onToggle={() => onChange({ instagram_hashtag_analysis: !config.instagram_hashtag_analysis })} disabled={disabled} />
      <Toggle label="Breakdown de conteudo (reels/fotos/carrosseis)" checked={config.instagram_content_breakdown} onToggle={() => onChange({ instagram_content_breakdown: !config.instagram_content_breakdown })} disabled={disabled} />
    </section>
  );
}
