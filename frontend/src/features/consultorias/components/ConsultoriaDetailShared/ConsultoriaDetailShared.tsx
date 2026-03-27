import { cn } from '../../../../lib/cn.ts';
import { Badge } from '../../../../components/ui/Badge.tsx';
import type { AnyPriority } from '../../consultorias.detail.types.ts';
import type { Meeting } from '../../services/consultorias.api.ts';

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded bg-[var(--bg-hover)] animate-pulse', className)} />
  );
}

// ─── Score circle SVG ────────────────────────────────────────────────────────

export function ScoreCircle({ score }: { score: number | null }) {
  const pct = score ?? 0;
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[100px] h-[100px]">
        <svg width="100" height="100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" stroke="var(--consulting-progress-track)" />
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8"
            stroke="var(--consulting-progress-fill, var(--consulting-iris, #7c5cfc))"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-[var(--text-primary)]">
          {score != null ? `${score}%` : '—'}
        </span>
      </div>
      <span className="text-xs text-[var(--text-tertiary)]">Implementação</span>
    </div>
  );
}

// ─── Priority badge ─────────────────────────────────────────────────────────

const PRIORITY_MAP: Record<AnyPriority, { label: string; cls: string }> = {
  at_risk:  { label: 'Em Risco', cls: 'bg-[rgba(255,59,48,0.10)] text-[var(--color-error)] ring-1 ring-inset ring-[rgba(255,59,48,0.20)]' },
  critical: { label: 'Crítica',  cls: 'bg-[rgba(255,59,48,0.10)] text-[var(--color-error)] ring-1 ring-inset ring-[rgba(255,59,48,0.20)]' },
  high:     { label: 'Alta',     cls: 'bg-[rgba(255,159,10,0.10)] text-[var(--color-warning)] ring-1 ring-inset ring-[rgba(255,159,10,0.20)]' },
  medium:   { label: 'Média',    cls: 'bg-[rgba(52,199,89,0.08)] text-[var(--color-success)] ring-1 ring-inset ring-[rgba(52,199,89,0.20)]' },
  normal:   { label: 'Normal',   cls: 'bg-[rgba(52,199,89,0.08)] text-[var(--color-success)] ring-1 ring-inset ring-[rgba(52,199,89,0.20)]' },
  low:      { label: 'Baixa',    cls: 'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] ring-1 ring-inset ring-[var(--border-hairline)]' },
};

export function PriorityBadge({ priority }: { priority: AnyPriority | null | undefined }) {
  if (!priority) return null;
  const cfg = PRIORITY_MAP[priority];
  if (!cfg) return null;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

// ─── Meeting badges ─────────────────────────────────────────────────────────

const MEETING_TYPE_LABELS: Record<Meeting['meeting_type'], string> = {
  kickoff: 'Kickoff', diagnostic: 'Diagnóstico', delivery: 'Entrega',
  checkpoint: 'Checkpoint', followup: 'Follow-up', closing: 'Encerramento',
};

export function MeetingTypeBadge({ type }: { type: Meeting['meeting_type'] }) {
  return <Badge variant="default" size="sm">{MEETING_TYPE_LABELS[type]}</Badge>;
}

const MEETING_STATUS_MAP: Record<Meeting['status'], { label: string; variant: 'success' | 'error' | 'default' }> = {
  scheduled: { label: 'Agendada', variant: 'default' },
  done:      { label: 'Realizada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'error' },
};

export function MeetingStatusBadge({ status }: { status: Meeting['status'] }) {
  const cfg = MEETING_STATUS_MAP[status];
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}
