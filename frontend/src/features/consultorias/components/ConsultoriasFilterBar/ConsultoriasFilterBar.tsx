import { motion } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { type SortOption, type PhaseFilter, type StatusFilter, phaseFilterLabels, statusFilterLabels } from '../../consultorias.helpers.ts';

interface ConsultoriasFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  phaseFilter: PhaseFilter;
  onPhaseFilterChange: (value: PhaseFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
}

const pillBase = 'px-3 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors';
const pillActive = 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]';
const pillInactive = 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]';

export function ConsultoriasFilterBar({
  search, onSearchChange, sortBy, onSortChange,
  phaseFilter, onPhaseFilterChange, statusFilter, onStatusFilterChange,
}: ConsultoriasFilterBarProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-xs">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" placeholder="Buscar cliente ou título…" value={search} onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-2)] pl-8 pr-3 py-1.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors" />
        </div>
        <select value={sortBy} onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-3 py-1.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer">
          <option value="recent">Recentes</option>
          <option value="priority">Prioridade</option>
          <option value="progress">Progresso</option>
          <option value="alpha">A-Z</option>
        </select>
      </div>

      {/* Phase pills */}
      <div className="flex gap-1 flex-wrap">
        {phaseFilterLabels.map(({ value, label }) => (
          <button key={value} onClick={() => onPhaseFilterChange(value)}
            className={cn(pillBase, phaseFilter === value ? pillActive : pillInactive)}>{label}</button>
        ))}
      </div>

      {/* Status pills */}
      <div className="flex gap-1 flex-wrap">
        {statusFilterLabels.map(({ value, label }) => (
          <button key={value} onClick={() => onStatusFilterChange(value)}
            className={cn(pillBase, statusFilter === value ? pillActive : pillInactive)}>{label}</button>
        ))}
      </div>
    </motion.div>
  );
}
