import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MarketResearchResponse } from '../../../../types/market-intelligence.ts';

interface Props {
  research: MarketResearchResponse;
  onRestart: () => Promise<void>;
  onRagIndex: () => Promise<void>;
  isIndexing: boolean;
}

export function PesquisaReport({ research, onRestart, onRagIndex, isIndexing }: Props) {
  const { report_markdown, key_insights, rag_indexed } = research;

  return (
    <div className="space-y-4">
      {key_insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {key_insights.opportunities.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs font-semibold text-emerald-400 mb-2">Oportunidades</p>
              <ul className="space-y-1">
                {key_insights.opportunities.map((o, i) => <li key={i} className="text-xs text-[var(--text-secondary)]">• {o}</li>)}
              </ul>
            </div>
          )}
          {key_insights.threats.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-xs font-semibold text-red-400 mb-2">Ameacas</p>
              <ul className="space-y-1">
                {key_insights.threats.map((t, i) => <li key={i} className="text-xs text-[var(--text-secondary)]">• {t}</li>)}
              </ul>
            </div>
          )}
          {key_insights.positioning && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
              <p className="text-xs font-semibold text-blue-400 mb-2">Posicionamento</p>
              <p className="text-xs text-[var(--text-secondary)]">{key_insights.positioning}</p>
            </div>
          )}
        </div>
      )}

      {report_markdown && (
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Relatorio de Mercado</h3>
          <div className="prose prose-sm prose-invert max-w-none text-[var(--text-secondary)] [&_h2]:text-[var(--text-primary)] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-[var(--text-primary)] [&_h3]:text-sm [&_h3]:font-semibold [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border-hairline)] [&_td]:px-2 [&_td]:py-1 [&_td]:text-xs [&_th]:border [&_th]:border-[var(--border-hairline)] [&_th]:px-2 [&_th]:py-1 [&_th]:text-xs [&_th]:font-semibold [&_li]:my-0.5 [&_strong]:text-[var(--text-primary)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report_markdown}</ReactMarkdown>
          </div>
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--border-hairline)]">
            <button type="button" onClick={onRestart}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Re-gerar Pesquisa
            </button>
            {rag_indexed ? (
              <span className="text-xs text-emerald-400">Indexado no RAG</span>
            ) : (
              <button type="button" onClick={onRagIndex} disabled={isIndexing}
                className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50 transition-opacity hover:opacity-90">
                {isIndexing ? 'Indexando...' : 'Indexar no RAG'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
