import type { MarketResearchResponse } from '../../../../types/market-intelligence.ts';

interface Props {
  research: MarketResearchResponse;
}

const STEPS = [
  'Descobrindo concorrentes locais (Maps)',
  'Analisando Instagram dos concorrentes',
  'Analisando sites dos concorrentes',
  'Gerando relatorio com IA',
  'Concluido',
];

export function PesquisaProgress({ research }: Props) {
  const current = research.progress_step;

  return (
    <div className="py-8 px-4 space-y-6">
      <div className="text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">{research.progress_label}</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Isso pode levar ate 5 minutos...</p>
      </div>
      <div className="max-w-sm mx-auto space-y-3">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isDone = current > stepNum;
          const isActive = current === stepNum;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-[var(--accent)] text-white' : 'bg-[var(--border-default)] text-[var(--text-tertiary)]'}`}>
                {isDone ? '✓' : isActive ? (
                  <span className="animate-pulse">●</span>
                ) : stepNum}
              </div>
              <span className={`text-sm ${isDone ? 'text-[var(--text-secondary)]' : isActive ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
