import { cn } from '../../../../lib/cn.ts';
import {
  type SortOption, type PhaseFilter, type StatusFilter,
  phaseFilterLabels, statusFilterLabels,
} from '../../consultorias.helpers.ts';

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

export function ConsultoriasFilterBar({
  search, onSearchChange, sortBy, onSortChange,
  phaseFilter, onPhaseFilterChange, statusFilter, onStatusFilterChange,
}: ConsultoriasFilterBarProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 overflow-x-auto"
      style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-hairline)',
        scrollbarWidth: 'none',
      }}
    >
      {/* Search */}
      <div className="relative shrink-0 w-44">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3"
          style={{ color: 'var(--text-muted)' }}
          fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] pl-7 pr-2 py-1 text-[12px] focus:outline-none transition-colors"
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-hairline)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-hairline)')}
        />
      </div>

      {/* Separator */}
      <div className="h-4 w-px shrink-0" style={{ background: 'var(--border-hairline)' }} />

      {/* Phase pills */}
      <div className="flex items-center gap-1 shrink-0">
        {phaseFilterLabels.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onPhaseFilterChange(value)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap',
              phaseFilter === value
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}
            style={phaseFilter === value ? {
              background: 'rgba(0,200,150,0.12)',
              border: '1px solid rgba(0,200,150,0.25)',
            } : {
              background: 'transparent',
              border: '1px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="h-4 w-px shrink-0" style={{ background: 'var(--border-hairline)' }} />

      {/* Status pills */}
      <div className="flex items-center gap-1 shrink-0">
        {statusFilterLabels.slice(1).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onStatusFilterChange(statusFilter === value ? 'all' : value)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap',
              statusFilter === value
                ? 'text-[#f87171]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}
            style={statusFilter === value ? {
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
            } : {
              background: 'transparent',
              border: '1px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort — pushed to the right */}
      <div className="ml-auto shrink-0">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] cursor-pointer focus:outline-none"
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border-hairline)',
            color: 'var(--text-secondary)',
          }}
        >
          <option value="recent">Recentes</option>
          <option value="priority">Prioridade</option>
          <option value="progress">Progresso</option>
          <option value="alpha">A-Z</option>
        </select>
      </div>
    </div>
  );
}
