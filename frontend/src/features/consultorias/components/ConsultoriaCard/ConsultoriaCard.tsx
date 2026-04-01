import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import type { Consultancy } from '../../services/consultorias.api.ts';
import { initials, relativeFuture } from '../../consultorias.helpers.ts';
import { PhaseBadge } from '../PhaseBadge';

// Per-phase gradient config for avatars
const PHASE_AVATAR: Record<string, { gradient: string; glow: string }> = {
  onboarding:     { gradient: 'linear-gradient(135deg, #0062ff, #00c6ff)', glow: 'rgba(0,150,255,0.4)' },
  diagnosis:      { gradient: 'linear-gradient(135deg, #ff6b35, #ff3cac)', glow: 'rgba(255,80,100,0.4)' },
  delivery:       { gradient: 'linear-gradient(135deg, #00c896, #00e5cc)', glow: 'rgba(0,200,150,0.4)' },
  implementation: { gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)', glow: 'rgba(150,80,250,0.4)' },
  support:        { gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', glow: 'rgba(245,100,50,0.4)' },
  closed:         { gradient: 'linear-gradient(135deg, #4b5563, #374151)', glow: 'rgba(100,100,100,0.3)' },
};

const DEFAULT_AVATAR = { gradient: 'linear-gradient(135deg, #1e293b, #334155)', glow: 'rgba(100,120,140,0.3)' };

interface ConsultoriaCardProps {
  consultancy: Consultancy;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onUnarchive: (id: string) => void;
}

export function ConsultoriaCard({ consultancy: c, onArchive, onDelete, onUnarchive }: ConsultoriaCardProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const phase = c.phase ?? 'onboarding';
  const avatarCfg = PHASE_AVATAR[phase] ?? DEFAULT_AVATAR;
  const isArchived = c.status === 'archived';
  const score = Math.min(100, Math.max(0, c.implementation_score ?? 0));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate('/consultorias/' + c.id)}
      className={cn(
        'relative rounded-[var(--radius-md)] p-4 cursor-pointer overflow-hidden',
        'transition-all duration-200',
        isArchived && 'opacity-50',
      )}
      style={{
        background: hovered
          ? 'var(--bg-surface-2)'
          : 'var(--bg-surface-1)',
        border: `1px solid ${hovered ? 'var(--border-subtle)' : 'var(--border-hairline)'}`,
        boxShadow: hovered
          ? `0 8px 32px -4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset`
          : '0 2px 8px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Priority stripe — left edge glow for at_risk */}
      {c.priority === 'at_risk' && (
        <div
          className="absolute left-0 inset-y-0 w-[3px] rounded-l-[var(--radius-md)]"
          style={{ background: 'linear-gradient(180deg, #ef4444, #dc2626)' }}
        />
      )}

      {/* Header row: avatar + info + phase badge */}
      <div className="flex items-start gap-3 pb-3">
        {/* Avatar */}
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

        {/* Info */}
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

        {/* Phase badge */}
        <div className="shrink-0">
          <PhaseBadge phase={c.phase} />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mb-3" style={{ background: 'var(--border-hairline)' }} />

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Implementação
          </span>
          <span
            className="text-[11px] font-bold tabular-nums"
            style={{ color: score > 0 ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            {score}%
          </span>
        </div>
        <div
          className="h-1.5 w-full rounded-full overflow-hidden"
          style={{ background: 'var(--bg-surface-2)' }}
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.1 }}
            style={{
              background: score >= 70
                ? 'linear-gradient(90deg, #00c896, #00e5cc)'
                : score >= 30
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #6b7280, #9ca3af)',
            }}
          />
        </div>
      </div>

      {/* Footer tags */}
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        {c.niche && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: 'var(--bg-surface-2)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            {c.niche}
          </span>
        )}
        {c.next_meeting_at && (
          <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            <svg className="h-2.5 w-2.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {relativeFuture(c.next_meeting_at)}
          </span>
        )}
        {c.credits_spent > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <svg className="h-2.5 w-2.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
            {c.credits_spent}
          </span>
        )}
        {c.priority === 'at_risk' && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ml-auto"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            Em risco
          </span>
        )}
        {c.priority === 'high' && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ml-auto"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            Alta prioridade
          </span>
        )}
      </div>

      {/* Hover action bar */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14 }}
            className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 py-2"
            style={{
              background: 'linear-gradient(to top, var(--bg-surface-2) 60%, transparent)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => navigate(`/consultorias/${c.id}/ai`)}
              className="flex-1 rounded-[var(--radius-sm)] py-1 text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #00c896)' }}
            >
              IA Dedicada
            </button>
            {isArchived ? (
              <button
                onClick={() => onUnarchive(c.id)}
                className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold transition-colors hover:text-[var(--accent)]"
                style={{ background: 'var(--bg-surface-1)', color: 'var(--text-muted)', border: '1px solid var(--border-hairline)' }}
              >
                Reativar
              </button>
            ) : (
              <button
                onClick={() => onArchive(c.id)}
                className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold transition-colors hover:text-[#fbbf24]"
                style={{ background: 'var(--bg-surface-1)', color: 'var(--text-muted)', border: '1px solid var(--border-hairline)' }}
              >
                Arquivar
              </button>
            )}
            <button
              onClick={() => onDelete(c.id)}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold transition-colors hover:text-[#f87171]"
              style={{ background: 'var(--bg-surface-1)', color: 'var(--text-muted)', border: '1px solid var(--border-hairline)' }}
            >
              Excluir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
