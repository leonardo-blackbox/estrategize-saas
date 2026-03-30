import { ScoreCircle } from '../ConsultoriaDetailShared';
import { formatDate, formatDateTime } from '../../consultorias.detail.helpers.ts';
import type { Consultancy, InsightCards } from '../../services/consultorias.api.ts';
import type { TabKey } from '../../consultorias.detail.types.ts';
import type { MeetingSession } from '../../../../api/meetings.ts';

interface ConsultoriaDetailOverviewProps {
  consultancy: Consultancy; insights: InsightCards | null;
  recentMeetings: MeetingSession[]; onTabChange: (t: TabKey) => void;
}
const C = 'rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]';
const L = 'text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5';
const Q: { key: TabKey; label: string }[] = [
  { key: 'ai', label: 'Chat IA' }, { key: 'meetings', label: 'Reunioes' },
  { key: 'diagnosis', label: 'Diagnostico' }, { key: 'actions', label: 'Plano de Acao' },
  { key: 'documentos', label: 'Documentos' },
];
const snip = (s: string) => s.length > 200 ? s.slice(0, 200) + '...' : s;

export function ConsultoriaDetailOverview({ consultancy, insights, recentMeetings, onTabChange }: ConsultoriaDetailOverviewProps) {
  const phase = consultancy.phase ? ` – ${consultancy.phase}` : '';
  const kfacts = [
    { label: 'Status', value: consultancy.status === 'active' ? `Ativa${phase}` : 'Arquivada' },
    { label: 'Progresso', value: `${consultancy.implementation_score ?? 0}%` },
    { label: 'Início', value: formatDate(consultancy.start_date) },
    { label: 'Previsão fim', value: formatDate(consultancy.end_date_estimated) },
  ];
  const mtDate = insights?.next_meeting?.scheduled_at
    ? formatDateTime(insights.next_meeting.scheduled_at)
    : consultancy.next_meeting_at ? formatDateTime(consultancy.next_meeting_at) : null;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
        <div className="rounded-[var(--radius-md)] p-5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col items-center justify-center min-w-[140px]">
          <ScoreCircle score={consultancy.implementation_score} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {kfacts.map((f) => (
            <div key={f.label} className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">{f.label}</div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{f.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={C} style={{ borderLeft: '4px solid #4A90E2' }}>
        <div className={L}>Proxima Reuniao</div>
        {mtDate ? (<><p className="text-sm font-medium text-[var(--text-primary)]">{insights?.next_meeting?.title}</p><p className="text-sm text-[var(--text-secondary)]">{mtDate}</p></>) : <p className="text-sm text-[var(--text-tertiary)] italic">Nenhuma reuniao agendada</p>}
      </div>
      <div className={C} style={{ borderLeft: '4px solid #b04aff' }}>
        <div className={L}>Insight IA</div>
        {insights?.ai_opportunity ? <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{insights.ai_opportunity}</p> : <p className="text-sm text-[var(--text-tertiary)] italic">Execute um diagnostico para ver insights</p>}
      </div>
      {recentMeetings.length > 0 && (
        <div className="space-y-2">
          <div className={L}>Ultimas Reunioes</div>
          {recentMeetings.map((m) => (
            <button key={m.id} onClick={() => onTabChange('meetings')} className={`${C} w-full text-left hover:bg-[var(--bg-hover)] transition-colors cursor-pointer`} style={{ borderLeft: '4px solid #7c5cfc' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--text-primary)]">{formatDate(m.ended_at ?? m.created_at)}</span>
                <span className="text-[10px] text-[var(--iris-violet,#7c5cfc)] font-medium">Ver reuniao →</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">{m.summary ? snip(m.summary) : 'Reuniao concluida'}</p>
            </button>
          ))}
        </div>
      )}
      {consultancy.real_bottleneck && (<div className={C} style={{ borderLeft: '4px solid var(--insight-bottleneck-border, #ff6b35)' }}><div className={L}>Gargalo Real</div><p className="text-sm text-[var(--text-secondary)] leading-relaxed">{consultancy.real_bottleneck}</p></div>)}
      <div className={C}>
        <div className={L}>Acesso Rapido</div>
        <div className="flex flex-wrap gap-2">
          {Q.map((link) => (<button key={link.key} onClick={() => onTabChange(link.key)} className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors border border-[var(--border-hairline)]">{link.label}</button>))}
        </div>
      </div>
    </div>
  );
}
