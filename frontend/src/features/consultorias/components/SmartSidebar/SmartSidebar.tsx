import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../components/ui/Button.tsx';
import type { Consultancy } from '../../services/consultorias.api.ts';
import { relativeFuture } from '../../consultorias.helpers.ts';
import { PhaseBadge } from '../PhaseBadge';

interface SmartSidebarProps {
  selected: Consultancy | null;
}

export function SmartSidebar({ selected }: SmartSidebarProps) {
  return (
    <div className="sticky top-4 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] overflow-hidden">
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[15px] font-semibold text-[var(--text-primary)] leading-tight">{selected.client_name ?? '—'}</p>
                <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 truncate max-w-[200px]">{selected.title}</p>
              </div>
              <PhaseBadge phase={selected.phase} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selected.implementation_score !== null && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] p-2.5">
                  <p className="text-[18px] font-bold text-[var(--text-primary)]">{selected.implementation_score}%</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Implementação</p>
                </div>
              )}
              {selected.credits_spent > 0 && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] p-2.5">
                  <p className="text-[18px] font-bold text-[var(--text-primary)]">{selected.credits_spent}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Créditos usados</p>
                </div>
              )}
              {selected.next_meeting_at && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] p-2.5 col-span-2">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{relativeFuture(selected.next_meeting_at)}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Próxima reunião</p>
                </div>
              )}
            </div>
            {selected.real_bottleneck && (
              <div className="rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] p-3" style={{ borderLeft: '2px solid var(--color-warning)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-warning)] mb-1">Gargalo Real</p>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{selected.real_bottleneck}</p>
              </div>
            )}
            <Link to={`/consultorias/${selected.id}`}>
              <Button variant="secondary" size="sm" fullWidth>Abrir Central da Cliente →</Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
            <div className="h-10 w-10 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center">
              <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">← Selecione uma consultoria para ver detalhes</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
