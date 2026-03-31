import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { phaseConfig, type Consultancy } from '../../services/consultorias.api.ts';
import { initials, relativeFuture } from '../../consultorias.helpers.ts';
import { PhaseBadge } from '../PhaseBadge';

interface ConsultoriaCardProps {
  consultancy: Consultancy;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onUnarchive: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function ConsultoriaCard({ consultancy: c, onArchive, onDelete, onUnarchive, isSelected, onSelect }: ConsultoriaCardProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const phase = c.phase ?? 'onboarding';
  const phaseCfg = phaseConfig[phase];
  const isArchived = c.status === 'archived';

  function handleClick() {
    if (onSelect) {
      onSelect(c.id);
    } else {
      navigate('/consultorias/' + c.id);
    }
  }

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      className={cn('relative rounded-[var(--radius-md)] p-4 border cursor-pointer overflow-hidden transition-all duration-150',
        'border-[var(--border-hairline)] bg-[var(--bg-surface-1)] shadow-[var(--shadow-soft)]',
        'hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)] hover:shadow-[var(--shadow-card-hover)]',
        isSelected && 'border-[var(--accent)] ring-1 ring-[var(--accent)] ring-inset',
        isArchived && 'opacity-60')}>
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-t from-[var(--bg-surface-1)] to-transparent"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => navigate(`/consultorias/${c.id}/ai`)} className="flex-1 rounded-[var(--radius-sm)] py-1 text-[11px] font-semibold text-white transition-colors" style={{ background: 'var(--consulting-ai-gradient)' }}>IA Dedicada</button>
            {isArchived
              ? <button onClick={() => onUnarchive(c.id)} className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-surface-2)] hover:text-[var(--color-success)] transition-colors">Reativar</button>
              : <button onClick={() => onArchive(c.id)} className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-surface-2)] hover:text-[var(--color-error)] transition-colors">Arquivar</button>
            }
            <button onClick={() => onDelete(c.id)} className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-surface-2)] hover:text-[var(--color-error)] transition-colors">Excluir</button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-start gap-3 pb-8">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[13px] font-bold" style={{ background: `var(${phaseCfg.bgVar})`, color: `var(${phaseCfg.colorVar})` }}>{initials(c.client_name)}</div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">{c.client_name ?? '—'}</p>
              {c.instagram && (
                <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight">@{c.instagram}</p>
              )}
              <p className="text-[11px] text-[var(--text-tertiary)] truncate leading-tight mt-0.5">{c.title}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <PhaseBadge phase={c.phase} />
              {(c.priority === 'at_risk' || c.priority === 'high') && (
                <span className={cn('inline-flex items-center rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider', c.priority === 'at_risk' ? 'bg-[rgba(255,59,48,0.12)] text-[var(--color-error)]' : 'bg-[rgba(255,159,10,0.12)] text-[var(--color-warning)]')}>{c.priority === 'at_risk' ? 'Em risco' : 'Alto'}</span>
              )}
            </div>
          </div>
          {c.implementation_score !== null && (
            <div>
              <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'var(--consulting-progress-track)' }}><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, c.implementation_score))}%`, background: 'var(--consulting-progress-fill)' }} /></div>
              <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">{c.implementation_score}% implementado</p>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {c.niche && <span className="inline-flex items-center rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-muted)] bg-[var(--bg-surface-2)] ring-1 ring-inset ring-[var(--border-hairline)]">{c.niche}</span>}
            {c.next_meeting_at && <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5"><svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>{relativeFuture(c.next_meeting_at)}</span>}
            {c.credits_spent > 0 && <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-0.5"><svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>{c.credits_spent}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
