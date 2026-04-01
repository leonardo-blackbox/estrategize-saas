import type { HelenaReport } from '../../../../types/helena.ts';

interface HelenaObjecaoCardProps {
  report: HelenaReport;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HelenaObjecaoCard({ report }: HelenaObjecaoCardProps) {
  return (
    <div
      className="border border-[var(--border-hairline)] bg-amber-500/5 rounded-[var(--radius-md)] p-3 border-l-2 border-l-amber-500 animate-pulse"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-500 flex items-center gap-1">
          <span>&#9651;</span>
          Objeção
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">{formatTime(report.timestamp)}</span>
      </div>

      <p className="text-sm text-[var(--text-primary)] mb-1">{report.sugestao_principal}</p>

      {report.frase_sugerida && (
        <p className="text-xs italic text-[var(--text-secondary)] mb-1">
          &ldquo;{report.frase_sugerida}&rdquo;
        </p>
      )}

      {report.ponto_atencao && (
        <div className="mt-2 rounded p-2 bg-amber-500/10 flex items-start gap-1.5">
          <span className="text-amber-500 text-xs mt-0.5">&#9651;</span>
          <p className="text-xs text-amber-700 dark:text-amber-400">{report.ponto_atencao}</p>
        </div>
      )}
    </div>
  );
}
