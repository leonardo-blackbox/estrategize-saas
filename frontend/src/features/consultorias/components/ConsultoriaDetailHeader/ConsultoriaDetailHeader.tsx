import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { getInitials } from '../../consultorias.detail.helpers.ts';
import { PriorityBadge } from '../ConsultoriaDetailShared';
import { phaseConfig, type Consultancy } from '../../services/consultorias.api.ts';

interface ConsultoriaDetailHeaderProps {
  consultancy: Consultancy;
  onEditClick: () => void;
  onGenerateDiagnosis: () => void;
  onNewMeeting: () => void;
  hasMeetingsPlugin: boolean;
}

export function ConsultoriaDetailHeader({
  consultancy,
  onEditClick,
  onGenerateDiagnosis,
  onNewMeeting,
  hasMeetingsPlugin,
}: ConsultoriaDetailHeaderProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const phase = consultancy.phase;
  const phaseCfg = phase ? phaseConfig[phase] : null;
  const avatarStyle = phaseCfg
    ? { backgroundColor: `var(${phaseCfg.bgVar})`, color: `var(${phaseCfg.colorVar})` }
    : { backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' };
  const initials = getInitials(consultancy.client_name, consultancy.title);
  const isActive = consultancy.status === 'active';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Link to="/consultorias" className="hover:text-[var(--text-secondary)] transition-colors">Consultorias</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)] truncate max-w-[220px]">{consultancy.client_name || consultancy.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 shrink-0 rounded-[var(--radius-lg)] flex items-center justify-center text-lg font-bold select-none" style={avatarStyle}>{initials}</div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{consultancy.client_name || consultancy.title}</h1>
              <span className={cn('w-2 h-2 rounded-full shrink-0', isActive ? 'bg-[var(--color-success)]' : 'bg-[var(--text-muted)]')} title={isActive ? 'Ativa' : 'Arquivada'} />
            </div>
            {consultancy.client_name && <p className="text-sm text-[var(--text-secondary)]">{consultancy.title}</p>}
            <div className="flex items-center gap-2 flex-wrap">
              {phaseCfg && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: `var(${phaseCfg.bgVar})`, color: `var(${phaseCfg.colorVar})` }}>{phaseCfg.label}</span>
              )}
              <PriorityBadge priority={consultancy.priority} />
              {consultancy.niche && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] ring-1 ring-inset ring-[var(--border-hairline)]">{consultancy.niche}</span>
              )}
            </div>
            {consultancy.strategic_summary && (
              <div className="max-w-xl">
                <p className={cn('text-[12px] text-[var(--text-secondary)] leading-relaxed', !summaryExpanded && 'line-clamp-2')}>{consultancy.strategic_summary}</p>
                {consultancy.strategic_summary.length > 120 && (
                  <button onClick={() => setSummaryExpanded((v) => !v)} className="text-[11px] text-[var(--consulting-iris,#7c5cfc)] hover:opacity-80 transition-opacity mt-0.5">
                    {summaryExpanded ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <span>🪙</span>
              <span>{consultancy.credits_spent} crédito{consultancy.credits_spent !== 1 ? 's' : ''} gastos</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onEditClick}>Editar Dados</Button>
          <Button variant="gradient" size="sm" onClick={onGenerateDiagnosis}
            style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg, #7c5cfc, #b04aff))' }}>✦ Gerar Diagnóstico</Button>
          <Button variant="secondary" size="sm" onClick={onNewMeeting}>
            {hasMeetingsPlugin ? '+ Nova Reunião' : '🎙️ Reuniões'}
          </Button>
        </div>
      </div>
    </div>
  );
}
