import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { Skeleton } from '../ConsultoriaDetailShared';
import { formatDate } from '../../consultorias.detail.helpers.ts';
import { getDiagnosis } from '../../services/consultorias.api.ts';
import { DiagnosisEmptyState } from './DiagnosisEmptyState.tsx';

interface ConsultoriaDetailDiagnosisProps { consultancyId: string; }

export function ConsultoriaDetailDiagnosis({ consultancyId }: ConsultoriaDetailDiagnosisProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['diagnosis', consultancyId],
    queryFn: () => getDiagnosis(consultancyId),
    enabled: !!consultancyId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
        <div className="flex items-center justify-between"><Skeleton className="h-4 w-48" /><Skeleton className="h-5 w-16 rounded-full" /></div>
        <Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-5/6" /><Skeleton className="h-3.5 w-4/6" />
      </div>
    );
  }

  const isNotFound = isError && (
    (error as Error)?.message?.includes('404') ||
    (error as Error)?.message?.toLowerCase().includes('not found') ||
    (error as Error)?.message?.toLowerCase().includes('nenhum')
  );

  if (isError || !data?.data) {
    return <DiagnosisEmptyState consultancyId={consultancyId} isNotFound={!!isNotFound} />;
  }

  const diagnosis = data.data;

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Diagnóstico IA (Método Iris)</h3>
          <div className="flex items-center gap-2">
            {diagnosis.is_edited && <Badge variant="drip">Editado</Badge>}
            <Badge variant="success">v{diagnosis.version}</Badge>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{diagnosis.content.executiveSummary}</p>
        <div className="text-xs text-[var(--text-tertiary)]">
          Gerado em {formatDate(diagnosis.created_at)}
          {diagnosis.tokens_used != null ? ` · ${diagnosis.tokens_used.toLocaleString('pt-BR')} tokens` : ''}
        </div>
      </div>
      {diagnosis.content.sections.map((section, idx) => (
        <div key={idx} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-2">
          <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">{section.name}</h4>
          <ul className="space-y-1.5">
            {section.insights.map((insight, iIdx) => (
              <li key={iIdx} className="flex gap-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0" />{insight}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
