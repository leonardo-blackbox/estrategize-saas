import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../../lib/cn.ts';
import { fetchAnalytics, applicationKeys } from '../../../api/applications.ts';
import type { ApplicationShellContext } from './ApplicationShell.tsx';

type Period = '7d' | '30d' | '90d';

function MetricCard({
  label,
  value,
  suffix = '',
  color,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  color?: string;
}) {
  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}
    >
      <p className="text-[12px] font-medium text-[var(--text-tertiary)] mb-2 uppercase tracking-wider">{label}</p>
      <p
        className="text-[28px] font-bold tracking-tight"
        style={{ color: color || 'var(--text-primary)', lineHeight: 1 }}
      >
        {value}
        {suffix && <span className="text-[16px] ml-1 opacity-60">{suffix}</span>}
      </p>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border-hairline)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-mono text-[var(--text-tertiary)] w-6 text-right">{value}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { application } = useOutletContext<ApplicationShellContext>();
  const [period, setPeriod] = useState<Period>('30d');

  const { data, isLoading } = useQuery({
    queryKey: [...(applicationKeys.analytics?.(application?.id || '') || []), period],
    queryFn: () => fetchAnalytics(application!.id, period),
    enabled: Boolean(application?.id),
    staleTime: 60_000,
  });

  if (!application) return null;

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Analytics</h2>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
            {(['7d', '30d', '90d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer',
                  period === p
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="inline-block w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
              <MetricCard label="Visualizações" value={data.views} />
              <MetricCard label="Inícios" value={data.starts} />
              <MetricCard label="Envios" value={data.submits} />
              <MetricCard label="Total respostas" value={data.total_responses} color="#7c5cfc" />
            </div>

            {/* Conversion rates */}
            <div
              className="p-5 rounded-xl mb-6"
              style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}
            >
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4">Funil de conversão</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] text-[var(--text-secondary)]">Visualizações → Inícios</span>
                    <span className="text-[12px] font-semibold text-[var(--text-primary)]">{data.start_rate}%</span>
                  </div>
                  <MiniBar value={data.starts} max={data.views} color="#7c5cfc" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] text-[var(--text-secondary)]">Inícios → Envios</span>
                    <span className="text-[12px] font-semibold text-[var(--text-primary)]">{data.completion_rate}%</span>
                  </div>
                  <MiniBar value={data.submits} max={data.starts} color="#30d158" />
                </div>
              </div>
            </div>

            {/* Timeline */}
            {data.timeline.length > 0 && (
              <div
                className="p-5 rounded-xl"
                style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}
              >
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4">
                  Eventos por dia
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...data.timeline].reverse().slice(0, 14).map((day) => (
                    <div key={day.date} className="flex items-center gap-3 text-[12px]">
                      <span className="text-[var(--text-tertiary)] font-mono w-24 flex-shrink-0">
                        {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                      <div className="flex gap-3 flex-1">
                        <span className="text-[var(--text-secondary)]">{day.views}v</span>
                        <span className="text-[#7c5cfc]">{day.starts}i</span>
                        <span className="text-[#30d158]">{day.submits}e</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-[var(--text-tertiary)]">v=visualizações  i=inícios  e=envios</p>
              </div>
            )}

            {data.views === 0 && (
              <div className="text-center py-12">
                <p className="text-[var(--text-tertiary)] text-[14px] mb-1">Nenhum evento registrado ainda</p>
                <p className="text-[var(--text-tertiary)] text-[12px]">Publique o formulário e compartilhe o link para começar a rastrear.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--text-tertiary)] text-[14px]">Não foi possível carregar os dados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
