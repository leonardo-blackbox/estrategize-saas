import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAnalyticsFilters } from '../../hooks/useAnalyticsFilters';
import { fetchAnalytics, applicationKeys } from '../../services/analytics.api';
import { fmtDate } from '../../utils/analytics-dates';
import { AnalyticsFilterBar } from '../AnalyticsFilterBar/AnalyticsFilterBar';
import { AnalyticsMetrics } from '../AnalyticsMetrics/AnalyticsMetrics';
import { AnalyticsDailyChart } from '../AnalyticsDailyChart/AnalyticsDailyChart';
import { AnalyticsHourlyHeatmap } from '../AnalyticsHourlyHeatmap/AnalyticsHourlyHeatmap';
import { AnalyticsUTMSection } from '../AnalyticsUTMSection/AnalyticsUTMSection';
import { AnalyticsLeadsTable } from '../AnalyticsLeadsTable/AnalyticsLeadsTable';
import type { ApplicationShellContext } from '../../../../pages/member/aplicacoes/ApplicationShell';

export function AnalyticsPage() {
  const { application } = useOutletContext<ApplicationShellContext>();
  const { filter, customRange, range, handleFilterSelect, handleCustomApply } = useAnalyticsFilters();

  const queryKey = [
    ...(applicationKeys.analytics?.(application?.id || '') || []),
    filter,
    filter === 'custom' ? JSON.stringify(customRange) : null,
  ];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchAnalytics(application!.id, '30d', range),
    enabled: Boolean(application?.id) && (filter !== 'custom' || Boolean(customRange)),
    staleTime: 60_000,
  });

  if (!application) return null;

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-3xl mx-auto px-6 py-8">

        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1">Analytics</h2>
            {data && <p className="text-[11px] text-[var(--text-tertiary)]">{fmtDate(data.from)} – {fmtDate(data.to)}</p>}
          </div>
        </div>

        <div className="mb-6 relative">
          <AnalyticsFilterBar active={filter} customRange={customRange} onSelect={handleFilterSelect} onCustomApply={handleCustomApply} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="inline-block w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filter === 'custom' && !customRange ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-tertiary)] text-[14px]">Selecione o intervalo no calendário para visualizar os dados.</p>
          </div>
        ) : data ? (
          <div className="space-y-5">
            <AnalyticsMetrics data={data} />
            {filter !== 'today' && data.timeline.length > 0 && <AnalyticsDailyChart timeline={data.timeline} />}
            <AnalyticsHourlyHeatmap hourly={data.hourly} />
            <AnalyticsUTMSection data={data} />
            <AnalyticsLeadsTable leads={data.leads} />
            {data.views === 0 && (
              <div className="text-center py-8">
                <p className="text-[var(--text-tertiary)] text-[14px] mb-1">Nenhum evento registrado no período</p>
                <p className="text-[var(--text-tertiary)] text-[12px]">Tente um período diferente ou publique o formulário para começar a rastrear.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--text-tertiary)] text-[14px]">Não foi possível carregar os dados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
