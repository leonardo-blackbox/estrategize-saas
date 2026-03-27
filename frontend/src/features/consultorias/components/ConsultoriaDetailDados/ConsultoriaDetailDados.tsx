import { Badge } from '../../../../components/ui/Badge.tsx';

export function ConsultoriaDetailDados() {
  return (
    <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col items-center justify-center text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center text-xl">🔒</div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Perfil da Consultoria</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
          Complete o perfil com modelo de negócio, tamanho do time, faturamento mensal e público-alvo.
        </p>
      </div>
      <Badge variant="drip">Disponível em breve</Badge>
    </div>
  );
}
