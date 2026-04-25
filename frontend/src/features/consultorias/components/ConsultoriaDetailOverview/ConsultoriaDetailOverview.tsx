import { ScoreCircle } from '../ConsultoriaDetailShared';
import { formatDate } from '../../consultorias.detail.helpers.ts';
import type { Consultancy, InsightCards } from '../../services/consultorias.api.ts';
import type { TabKey } from '../../consultorias.detail.types.ts';
import type { MeetingSession } from '../../../../api/meetings.ts';

interface ConsultoriaDetailOverviewProps {
  consultancy: Consultancy;
  insights: InsightCards | null;
  recentMeetings: MeetingSession[];
  onTabChange: (t: TabKey) => void;
}

const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-2';

const snip = (s: string) => (s.length > 200 ? s.slice(0, 200) + '...' : s);

export function ConsultoriaDetailOverview({
  consultancy,
  recentMeetings,
  onTabChange,
}: ConsultoriaDetailOverviewProps) {
  const phase = consultancy.phase ? ` · ${consultancy.phase}` : '';
  const kfacts = [
    { label: 'Status',       value: consultancy.status === 'active' ? `Ativa${phase}` : 'Arquivada' },
    { label: 'Progresso',    value: `${consultancy.implementation_score ?? 0}%` },
    { label: 'Início',       value: formatDate(consultancy.start_date) },
    { label: 'Previsão fim', value: formatDate(consultancy.end_date_estimated) },
  ];

  return (
    <div className="space-y-5">
      {/* Score + KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-stretch">
        <div className="consult-glass p-6 flex flex-col items-center justify-center min-w-[160px]">
          <ScoreCircle score={consultancy.implementation_score} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {kfacts.map((f) => (
            <div key={f.label} className="consult-glass p-4">
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.08em] font-semibold mb-1">
                {f.label}
              </div>
              <div className="text-[15px] font-semibold text-[var(--text-primary)]">
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottleneck (only when set) */}
      {consultancy.real_bottleneck && (
        <div className="consult-glass p-5">
          <div className={LABEL}>Gargalo Real</div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {consultancy.real_bottleneck}
          </p>
        </div>
      )}

      {/* Recent meetings */}
      {recentMeetings.length > 0 && (
        <div className="space-y-2.5">
          <div className={`${LABEL} px-1`}>Últimas Reuniões</div>
          {recentMeetings.map((m) => (
            <button
              key={m.id}
              onClick={() => onTabChange('meetings')}
              className="consult-glass consult-glass-hover p-4 w-full text-left cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {formatDate(m.ended_at ?? m.created_at)}
                </span>
                <span className="text-[11px] text-[var(--accent)] font-medium">
                  Ver reunião →
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                {m.summary ? snip(m.summary) : 'Reunião concluída'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
