import type { HelenaReport } from '../../../../types/helena.ts';

interface HelenaCardProps {
  report: HelenaReport;
}

type TipoConfig = {
  border: string;
  text: string;
  label: string;
};

const TIPO_MAP: Record<'abertura' | 'meio' | 'fechamento', TipoConfig> = {
  abertura: { border: 'border-l-violet-500', text: 'text-violet-500', label: 'Abertura' },
  meio: { border: 'border-l-blue-500', text: 'text-blue-500', label: 'Meio' },
  fechamento: { border: 'border-l-emerald-500', text: 'text-emerald-500', label: 'Fechamento' },
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HelenaCard({ report }: HelenaCardProps) {
  if (report.tipo === 'objecao') return null;

  const config = TIPO_MAP[report.tipo];
  const isPulse = report.urgencia === 'alta';

  return (
    <div
      className={`border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] rounded-[var(--radius-md)] p-3 border-l-2 ${config.border} ${isPulse ? 'animate-pulse' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-semibold uppercase tracking-wide ${config.text}`}>
          {config.label}
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
          <span className="text-amber-500 text-xs mt-0.5">⚠</span>
          <p className="text-xs text-amber-700 dark:text-amber-400">{report.ponto_atencao}</p>
        </div>
      )}
    </div>
  );
}
