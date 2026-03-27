import { cn } from '../../../../lib/cn.ts';
import type { Application } from '../../../../api/applications.ts';
import type { FilterTab } from '../../hooks/useAplicacoes.ts';

interface AplicacoesToolbarProps {
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  applications: Application[];
}

const TABS: Array<{ id: FilterTab; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'published', label: 'Publicados' },
  { id: 'draft', label: 'Rascunhos' },
  { id: 'archived', label: 'Arquivados' },
];

export function AplicacoesToolbar({ activeFilter, onFilterChange, search, onSearchChange, applications }: AplicacoesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className={cn('flex items-center gap-1 p-1 rounded-[var(--radius-md)]', 'bg-[var(--bg-surface-1)] ring-1 ring-[var(--border-hairline)]')}>
        {TABS.map((tab) => (
          <button
            key={tab.id} onClick={() => onFilterChange(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-[calc(var(--radius-md)-4px)] text-[13px] font-medium transition-all duration-150',
              activeFilter === tab.id
                ? 'bg-[var(--bg-surface-3)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
            )}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-1.5 text-[11px] text-[var(--text-tertiary)]">
                {applications.filter((a) => a.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="relative w-full sm:w-64">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          type="search" placeholder="Buscar aplicação…" value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full pl-9 pr-4 py-2 text-[13px] rounded-[var(--radius-md)]',
            'bg-[var(--bg-surface-1)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
            'ring-1 ring-[var(--border-hairline)] focus:ring-[var(--accent)] focus:outline-none transition-shadow duration-150',
          )}
        />
      </div>
    </div>
  );
}
