import type { HelenaAnalytics } from '../../../../api/adminHelena.ts';

interface HelenaAnalyticsSectionProps {
  analytics: HelenaAnalytics | null;
  isLoading: boolean;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  skeleton?: boolean;
}

function KpiCard({ label, value, skeleton }: KpiCardProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4 space-y-1">
      <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
      {skeleton ? (
        <div className="h-7 w-16 animate-pulse rounded bg-[var(--border-hairline)]" />
      ) : (
        <p className="text-xl font-semibold text-[var(--text-primary)]">{value}</p>
      )}
    </div>
  );
}

export function HelenaAnalyticsSection({ analytics, isLoading }: HelenaAnalyticsSectionProps) {
  const isNull = !isLoading && analytics === null;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Analytics</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Resumo de uso da Helena em reunioes.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Reunioes Ativas" value={isNull ? '--' : (analytics?.active_meetings ?? '--')} skeleton={isLoading} />
        <KpiCard label="Reports Gerados" value={isNull ? '--' : (analytics?.reports_generated ?? '--')} skeleton={isLoading} />
        <KpiCard label="Objecoes Detectadas" value={isNull ? '--' : (analytics?.objections_detected ?? '--')} skeleton={isLoading} />
        <KpiCard label="Top Consultora" value={isNull ? '--' : (analytics?.top_consultoras[0]?.name ?? '--')} skeleton={isLoading} />
      </div>

      {isNull && (
        <p className="text-xs text-[var(--text-tertiary)] text-center mt-2">
          Analytics disponivel em breve.
        </p>
      )}
    </div>
  );
}
