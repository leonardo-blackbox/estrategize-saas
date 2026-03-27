import { phaseConfig, type ConsultancyPhase } from '../../services/consultorias.api.ts';

interface PhaseBadgeProps {
  phase: ConsultancyPhase | null;
}

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  if (!phase) return null;
  const cfg = phaseConfig[phase];
  return (
    <span
      className="inline-flex items-center rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold tracking-tight whitespace-nowrap"
      style={{
        color: `var(${cfg.colorVar})`,
        background: `var(${cfg.bgVar})`,
      }}
    >
      {cfg.label}
    </span>
  );
}
