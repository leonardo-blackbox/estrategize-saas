import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/Button.tsx';
import { client, type Diagnosis } from '../../services/consultorias.api.ts';
import { useMetaConnection } from '../../hooks/useMetaConnection.ts';

interface DiagnosisEmptyStateProps {
  consultancyId: string;
  isNotFound: boolean;
}

export function DiagnosisEmptyState({ consultancyId, isNotFound }: DiagnosisEmptyStateProps) {
  const qc = useQueryClient();
  const { connection } = useMetaConnection(consultancyId);
  const canEnrich = connection?.status === 'active';

  const generateMutation = useMutation({
    mutationFn: () => client.post(`/api/consultancies/${consultancyId}/diagnose`).json<{ data: Diagnosis }>(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diagnosis', consultancyId] }); },
  });

  const generateEnrichedMutation = useMutation({
    mutationFn: () =>
      client.post(`/api/consultancies/${consultancyId}/diagnose/with-insights`).json<{ data: Diagnosis }>(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diagnosis', consultancyId] }); },
  });

  const isWorking = generateMutation.isPending || generateEnrichedMutation.isPending;
  const lastError = (generateMutation.error ?? generateEnrichedMutation.error) as Error | null;

  return (
    <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Diagnóstico IA (Método Iris)</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          {isNotFound ? 'Nenhum diagnóstico gerado ainda.' : 'Erro ao carregar diagnóstico.'}
        </p>
      </div>
      {lastError && (
        <p className="text-[12px] text-[var(--color-error)]">
          {lastError.message || 'Erro ao gerar diagnóstico. Tente novamente.'}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {canEnrich && (
          <div className="space-y-1.5">
            <Button size="sm" onClick={() => generateEnrichedMutation.mutate()} disabled={isWorking}>
              {generateEnrichedMutation.isPending ? 'Analisando dados oficiais...' : '⚡ Gerar com dados oficiais'}
            </Button>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Usa métricas oficiais do Instagram (reach, saves, demografia engajada) + última pesquisa de mercado. Custa 1 crédito.
            </p>
          </div>
        )}
        <div className="space-y-1.5">
          <Button
            size="sm"
            variant={canEnrich ? 'ghost' : 'primary'}
            onClick={() => generateMutation.mutate()}
            disabled={isWorking}
          >
            {generateMutation.isPending ? 'Gerando…' : canEnrich ? 'Gerar diagnóstico padrão' : 'Gerar Diagnóstico com IA'}
          </Button>
          <p className="text-[11px] text-[var(--text-tertiary)]">Custa 1 crédito. Pode levar alguns segundos.</p>
        </div>
      </div>
    </div>
  );
}
