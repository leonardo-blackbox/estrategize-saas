import { ScoreCircle } from '../ConsultoriaDetailShared';
import { formatDate } from '../../consultorias.detail.helpers.ts';
import type { Consultancy } from '../../services/consultorias.api.ts';
import type { TabKey } from '../../consultorias.detail.types.ts';

interface ConsultoriaDetailOverviewProps {
  consultancy: Consultancy;
  onTabChange: (t: TabKey) => void;
}

export function ConsultoriaDetailOverview({ consultancy, onTabChange }: ConsultoriaDetailOverviewProps) {
  const score = consultancy.implementation_score;
  const kfacts = [
    { label: 'Status',       value: consultancy.status === 'active' ? 'Ativa' : 'Arquivada' },
    { label: 'Criada em',    value: formatDate(consultancy.created_at) },
    { label: 'Início',       value: formatDate(consultancy.start_date) },
    { label: 'Previsão fim', value: formatDate(consultancy.end_date_estimated) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
        <div className="rounded-[var(--radius-md)] p-5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col items-center justify-center min-w-[140px]">
          <div className="relative"><ScoreCircle score={score} /></div>
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

      {consultancy.real_bottleneck && (
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
          style={{ borderLeft: '4px solid var(--insight-bottleneck-border, #ff6b35)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">⚡ Gargalo Real</div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{consultancy.real_bottleneck}</p>
        </div>
      )}

      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Acesso Rápido</div>
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'diagnosis' as TabKey,    label: '🔍 Diagnóstico IA' },
            { key: 'meetings' as TabKey,     label: '📅 Reuniões' },
            { key: 'actions' as TabKey,      label: '✅ Plano de Ação' },
            { key: 'ai' as TabKey,           label: '✦ IA da Consultoria' },
            { key: 'deliverables' as TabKey, label: '📄 Entregáveis' },
          ]).map((link) => (
            <button key={link.key} onClick={() => onTabChange(link.key)}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors border border-[var(--border-hairline)]">
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
