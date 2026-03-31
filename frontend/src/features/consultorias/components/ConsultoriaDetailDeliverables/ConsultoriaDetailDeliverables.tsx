import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Skeleton } from '../ConsultoriaDetailShared';
import { formatDate } from '../../consultorias.detail.helpers.ts';
import { fetchDeliverables, consultancyKeys, type DeliverableType, type Deliverable } from '../../services/consultorias.api.ts';
import { DeliverableDropdown } from './DeliverableDropdown.tsx';
import { DeliverableModal } from './DeliverableModal.tsx';

const TYPE_LABELS: Record<DeliverableType, string> = {
  executive_summary: 'Resumo Executivo', meeting_summary: 'Resumo de Reunião',
  action_plan: 'Plano de Ação', strategic_diagnosis: 'Diagnóstico Estratégico',
  positioning_doc: 'Posicionamento', content_bank: 'Banco de Conteúdo',
  competition_analysis: 'Concorrência', presentation: 'Apresentação',
  financial_projection: 'Projeção Financeira', market_research: 'Pesquisa de Mercado',
  brand_guide: 'Guia de Marca', custom: 'Personalizado',
};

interface ConsultoriaDetailDeliverablesProps { consultancyId: string; }

export function ConsultoriaDetailDeliverables({ consultancyId }: ConsultoriaDetailDeliverablesProps) {
  const [selected, setSelected] = useState<Deliverable | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: consultancyKeys.deliverables(consultancyId),
    queryFn: () => fetchDeliverables(consultancyId),
  });

  const deliverables = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
            <Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Entregáveis ({deliverables.length})</h3>
          <DeliverableDropdown consultancyId={consultancyId} />
        </div>

        {deliverables.length === 0 ? (
          <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-3">
            <div className="text-3xl">📄</div>
            <p className="text-sm text-[var(--text-secondary)]">Nenhum entregável gerado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliverables.map((d) => (
              <div key={d.id} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default" size="sm">{TYPE_LABELS[d.type]}</Badge>
                    {d.ai_generated && <Badge variant="accent" size="sm">✦ IA</Badge>}
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{d.title}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{formatDate(d.created_at)} · v{d.version}</p>
                </div>
                <Button variant="secondary" size="xs" onClick={() => setSelected(d)}>Ver</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeliverableModal deliverable={selected} onClose={() => setSelected(null)} />
    </>
  );
}
