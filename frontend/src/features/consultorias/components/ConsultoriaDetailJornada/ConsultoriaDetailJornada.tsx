import { cn } from '../../../../lib/cn.ts';
import { phaseConfig, type Consultancy, type ConsultancyPhase } from '../../services/consultorias.api.ts';

const JOURNEY_STAGES = [
  { id: 'contract',       label: 'Contrato',       phase: 'onboarding' as ConsultancyPhase },
  { id: 'briefing',       label: 'Briefing',        phase: 'onboarding' as ConsultancyPhase },
  { id: 'diagnosis',      label: 'Diagnóstico',     phase: 'diagnosis' as ConsultancyPhase },
  { id: 'delivery',       label: 'Entrega',         phase: 'delivery' as ConsultancyPhase },
  { id: 'implementation', label: 'Implementação',   phase: 'implementation' as ConsultancyPhase },
  { id: 'support',        label: 'Suporte',         phase: 'support' as ConsultancyPhase },
  { id: 'closing',        label: 'Encerramento',    phase: 'closed' as ConsultancyPhase },
];

const PHASE_ORDER: ConsultancyPhase[] = ['onboarding', 'diagnosis', 'delivery', 'implementation', 'support', 'closed'];

interface ConsultoriaDetailJornadaProps {
  consultancy: Consultancy;
}

export function ConsultoriaDetailJornada({ consultancy }: ConsultoriaDetailJornadaProps) {
  const currentPhase = consultancy.phase;
  const currentPhaseIdx = currentPhase ? PHASE_ORDER.indexOf(currentPhase) : -1;

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] p-5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-6">Jornada da Consultoria</h3>
        <div className="relative">
          <div className="absolute left-4 top-4 bottom-0 w-px bg-[var(--border-hairline)]" />
          <div className="space-y-6">
            {JOURNEY_STAGES.map((stage, idx) => {
              const stagePhaseIdx = PHASE_ORDER.indexOf(stage.phase);
              const isDone = currentPhaseIdx > stagePhaseIdx;
              const isCurrent = currentPhase === stage.phase;
              const isPending = currentPhaseIdx < stagePhaseIdx;
              const pCfg = phaseConfig[stage.phase];

              return (
                <div key={stage.id} className="relative flex items-center gap-4 pl-10">
                  <div className={cn(
                    'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10',
                    isDone && 'bg-[var(--color-success)] text-white',
                    isCurrent && 'border-2 border-[var(--consulting-iris,#7c5cfc)] bg-[var(--bg-surface-2)]',
                    isPending && 'bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border-hairline)]',
                  )} style={isCurrent ? { color: `var(${pCfg.colorVar})` } : undefined}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-3 flex-wrap">
                    <span className={cn('text-sm font-medium',
                      isDone && 'text-[var(--text-secondary)] line-through',
                      isCurrent && 'text-[var(--text-primary)]',
                      isPending && 'text-[var(--text-muted)]')}>
                      {stage.label}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={isCurrent ? { backgroundColor: `var(${pCfg.bgVar})`, color: `var(${pCfg.colorVar})` }
                        : { backgroundColor: 'var(--bg-surface-2)', color: isDone ? 'var(--color-success)' : 'var(--text-muted)' }}>
                      {isDone ? 'Concluída' : isCurrent ? 'Atual' : 'Pendente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="rounded-[var(--radius-md)] p-3.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex items-center gap-3">
        <span className="text-base">🚀</span>
        <p className="text-xs text-[var(--text-tertiary)]">Em breve: checklist interativo por fase com tarefas e marcos.</p>
      </div>
    </div>
  );
}
