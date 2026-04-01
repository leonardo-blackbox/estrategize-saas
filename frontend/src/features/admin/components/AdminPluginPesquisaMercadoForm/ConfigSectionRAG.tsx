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

export function ConfigSectionRAG({ config, onChange, disabled }: Props) {
  return (
    <section className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Integracao RAG</h3>
      <Toggle label="Indexar relatorio automaticamente no RAG apos conclusao" checked={config.auto_index_rag} onToggle={() => onChange({ auto_index_rag: !config.auto_index_rag })} disabled={disabled} />
      <div className="flex items-center justify-between py-2">
        <label className="text-sm text-[var(--text-secondary)]">Tag de contexto RAG</label>
        <input
          type="text"
          value={config.rag_context_tag}
          disabled={disabled}
          maxLength={100}
          placeholder="pesquisa-mercado"
          onChange={(e) => onChange({ rag_context_tag: e.target.value })}
          className="bg-[var(--bg-surface-1)] text-sm text-[var(--text-primary)] rounded px-2 py-1 border border-[var(--border-default)] w-40 disabled:opacity-40"
        />
      </div>
      <Toggle label="Incluir dados brutos dos concorrentes no RAG" checked={config.include_raw_data_in_rag} onToggle={() => onChange({ include_raw_data_in_rag: !config.include_raw_data_in_rag })} disabled={disabled} />
    </section>
  );
}
