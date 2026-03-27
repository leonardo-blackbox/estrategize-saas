import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/Button.tsx';
import { client, type Diagnosis } from '../../services/consultorias.api.ts';

interface DiagnosisEmptyStateProps {
  consultancyId: string;
  isNotFound: boolean;
}

export function DiagnosisEmptyState({ consultancyId, isNotFound }: DiagnosisEmptyStateProps) {
  const qc = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: () => client.post(`/api/consultancies/${consultancyId}/diagnose`).json<{ data: Diagnosis }>(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diagnosis', consultancyId] }); },
  });

  return (
    <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Diagnóstico IA (Método Iris)</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          {isNotFound ? 'Nenhum diagnóstico gerado ainda.' : 'Erro ao carregar diagnóstico.'}
        </p>
      </div>
      {generateMutation.isError && (
        <p className="text-[12px] text-[var(--color-error)]">
          {(generateMutation.error as Error)?.message || 'Erro ao gerar diagnóstico. Tente novamente.'}
        </p>
      )}
      <div className="space-y-1.5">
        <Button size="sm" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? 'Gerando…' : 'Gerar Diagnóstico com IA'}
        </Button>
        <p className="text-[11px] text-[var(--text-tertiary)]">Custa 1 crédito. Pode levar alguns segundos.</p>
      </div>
    </div>
  );
}
