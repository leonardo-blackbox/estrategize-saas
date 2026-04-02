import type { Consultancy } from '../../../services/consultorias.api.ts';
import { initials } from '../../../consultorias.helpers.ts';
import { PhaseBadge } from '../../PhaseBadge';

const PHASE_AVATAR: Record<string, { gradient: string; glow: string }> = {
  onboarding:     { gradient: 'linear-gradient(135deg, #0062ff, #00c6ff)', glow: 'rgba(0,150,255,0.4)' },
  diagnosis:      { gradient: 'linear-gradient(135deg, #ff6b35, #ff3cac)', glow: 'rgba(255,80,100,0.4)' },
  delivery:       { gradient: 'linear-gradient(135deg, #00c896, #00e5cc)', glow: 'rgba(0,200,150,0.4)' },
  implementation: { gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)', glow: 'rgba(150,80,250,0.4)' },
  support:        { gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', glow: 'rgba(245,100,50,0.4)' },
  closed:         { gradient: 'linear-gradient(135deg, #4b5563, #374151)', glow: 'rgba(100,100,100,0.3)' },
};

const DEFAULT_AVATAR = { gradient: 'linear-gradient(135deg, #1e293b, #334155)', glow: 'rgba(100,120,140,0.3)' };

interface CardHeaderProps {
  consultancy: Consultancy;
}

export function CardHeader({ consultancy: c }: CardHeaderProps) {
  const phase = c.phase ?? 'onboarding';
  const avatarCfg = PHASE_AVATAR[phase] ?? DEFAULT_AVATAR;

  return (
    <div className="flex items-start gap-3 pb-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[14px] font-bold text-white select-none"
        style={{
          background: avatarCfg.gradient,
          boxShadow: `0 4px 12px -2px ${avatarCfg.glow}`,
          letterSpacing: '-0.02em',
        }}
      >
        {initials(c.client_name)}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[14px] font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
          {c.client_name ?? '—'}
        </p>
        {c.instagram && (
          <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
            @{c.instagram}
          </p>
        )}
        <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
          {c.title}
        </p>
      </div>

      <div className="shrink-0">
        <PhaseBadge phase={c.phase} />
      </div>
    </div>
  );
}
