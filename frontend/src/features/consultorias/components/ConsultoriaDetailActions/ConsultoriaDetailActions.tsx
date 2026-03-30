import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/Button.tsx';
import { Skeleton } from '../ConsultoriaDetailShared';
import { fetchActionItems, generateDeliverable, consultancyKeys, type ActionItem } from '../../services/consultorias.api.ts';
import { ActionItemCard } from './ActionItemCard.tsx';

interface ConsultoriaDetailActionsProps { consultancyId: string; }

export function ConsultoriaDetailActions({ consultancyId }: ConsultoriaDetailActionsProps) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: consultancyKeys.actions(consultancyId),
    queryFn: () => fetchActionItems(consultancyId),
  });

  const generatePlanMutation = useMutation({
    mutationFn: () => generateDeliverable(consultancyId, 'action_plan'),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultancyKeys.actions(consultancyId) }),
  });

  const actions = data?.data ?? [];
  const columns: { label: string; items: ActionItem[]; accent: string }[] = [
    { label: 'A fazer',       items: actions.filter((a) => a.status === 'todo'),        accent: 'var(--text-tertiary)' },
    { label: 'Em andamento',  items: actions.filter((a) => a.status === 'in_progress'), accent: 'var(--color-warning)' },
    { label: 'Concluído',     items: actions.filter((a) => a.status === 'done'),        accent: 'var(--color-success)' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-2">
            <Skeleton className="h-3 w-20" /><Skeleton className="h-16 w-full rounded" /><Skeleton className="h-16 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Plano de Ação ({actions.length})</h3>
        <Button variant="gradient" size="sm" onClick={() => generatePlanMutation.mutate()} loading={generatePlanMutation.isPending}
          style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg, #7c5cfc, #b04aff))' }}>
          ✦ Gerar Plano com IA<span className="ml-1 text-[10px] opacity-70">4cr</span>
        </Button>
      </div>
      {actions.length === 0 ? (
        <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-3">
          <div className="text-3xl">✅</div>
          <p className="text-sm text-[var(--text-secondary)]">Nenhuma ação criada. Use a IA para gerar um plano estratégico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div key={col.label} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.accent }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{col.label}</span>
                <span className="ml-auto text-[11px] text-[var(--text-muted)]">{col.items.length}</span>
              </div>
              {col.items.length === 0
                ? <p className="text-[11px] text-[var(--text-muted)] italic">Nenhuma</p>
                : col.items.map((item) => <ActionItemCard key={item.id} item={item} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
