import { cn } from '../../../../lib/cn.ts';
import { Skeleton } from '../ConsultoriaDetailShared';
import { formatDateTime } from '../../consultorias.detail.helpers.ts';
import type { InsightCards } from '../../services/consultorias.api.ts';

interface ConsultoriaDetailInsightsProps {
  insights: InsightCards | null | undefined;
  isLoading: boolean;
}

export function ConsultoriaDetailInsights({ insights, isLoading }: ConsultoriaDetailInsightsProps) {
  const cards = [
    { title: 'Gargalo Real', borderVar: '--insight-bottleneck-border', defaultBorder: '#ff6b35',
      content: insights?.bottleneck ?? null, empty: 'Diagnóstico pendente', icon: '⚡' },
    { title: 'Prioridades da Semana', borderVar: '--insight-priorities-border', defaultBorder: '#f5a623',
      content: null as null, priorities: insights?.week_priorities, empty: 'Nenhuma prioridade definida', icon: '📌' },
    { title: 'Próxima Reunião', borderVar: '--insight-meeting-border', defaultBorder: '#4A90E2',
      content: insights?.next_meeting ? `${insights.next_meeting.title} — ${formatDateTime(insights.next_meeting.scheduled_at)}` : null,
      empty: 'Sem reuniões agendadas', icon: '📅' },
    { title: 'Oportunidade IA', borderVar: '--insight-opportunity-border', defaultBorder: '#b04aff',
      content: insights?.ai_opportunity ?? null, empty: 'Execute um diagnóstico para ver oportunidades', icon: '✦', isAI: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.title} className="rounded-[var(--radius-md)] p-3.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
          style={{ borderLeft: `4px solid var(${card.borderVar}, ${card.defaultBorder})` }}>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[13px]">{card.icon}</span>
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider',
                  card.isAI ? 'bg-gradient-to-r from-[var(--consulting-ai-accent,#b04aff)] to-[var(--consulting-iris,#7c5cfc)] bg-clip-text text-transparent'
                    : 'text-[var(--text-tertiary)]')}>
                  {card.title}
                </span>
              </div>
              {card.priorities !== undefined ? (
                card.priorities && card.priorities.length > 0 ? (
                  <ul className="space-y-1">
                    {card.priorities.slice(0, 3).map((p, i) => (
                      <li key={i} className="flex gap-1.5 text-[12px] text-[var(--text-secondary)] leading-snug">
                        <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0" />{p}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[12px] text-[var(--text-muted)] italic">{card.empty}</p>
              ) : (
                <p className={cn('text-[12px] leading-relaxed', card.content ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)] italic')}>
                  {card.content ?? card.empty}
                </p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
