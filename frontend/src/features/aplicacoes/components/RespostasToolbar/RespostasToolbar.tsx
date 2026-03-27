import { cn } from '../../../../lib/cn';
import type { ViewMode, DateFilter } from '../../utils/respostas.helpers';

interface RespostasToolbarProps {
  isLoading: boolean;
  filteredCount: number;
  totalCount: number;
  dateFilter: DateFilter;
  showUTMColumns: boolean;
  hasUTMData: boolean;
  viewMode: ViewMode;
  isExporting: boolean;
  onDateFilterChange: (filter: DateFilter) => void;
  onToggleUTM: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onExport: () => void;
}

export function RespostasToolbar({
  isLoading,
  filteredCount,
  totalCount,
  dateFilter,
  showUTMColumns,
  viewMode,
  isExporting,
  onDateFilterChange,
  onToggleUTM,
  onViewModeChange,
  onExport,
}: RespostasToolbarProps) {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface-1)',
        flexShrink: 0,
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {isLoading
          ? '...'
          : `${filteredCount} resposta${filteredCount !== 1 ? 's' : ''}`}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {/* Period filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
          {(['all', 'today', '7d', '30d'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onDateFilterChange(f)}
              className={cn(
                'px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer',
                dateFilter === f
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              {f === 'all' ? 'Todas' : f === 'today' ? 'Hoje' : f === '7d' ? '7d' : '30d'}
            </button>
          ))}
        </div>

        {/* UTM toggle */}
        <button
          onClick={onToggleUTM}
          className={cn(
            'px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer border',
            showUTMColumns
              ? 'text-white border-[#7c5cfc]'
              : 'text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]',
          )}
          style={{
            background: showUTMColumns ? 'rgba(124,92,252,0.15)' : 'transparent',
            color: showUTMColumns ? '#7c5cfc' : undefined,
          }}
        >
          UTM
        </button>

        <div style={{ width: 1, height: 18, background: 'var(--border-hairline)' }} />

        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 7,
            padding: 2,
            gap: 1,
          }}
        >
          {(['individual', 'tabela'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === mode ? 'var(--bg-surface-1)' : 'transparent',
                color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-tertiary)',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              {mode === 'individual' ? 'Individual' : 'Tabela'}
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={onExport}
          disabled={isExporting || totalCount === 0}
          style={{
            padding: '6px 12px',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            background: 'transparent',
            border: '1px solid var(--border-hairline)',
            color: totalCount === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
            cursor: totalCount === 0 ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.6 : 1,
            transition: 'color 0.15s',
          }}
        >
          {isExporting ? 'Exportando\u2026' : 'Exportar CSV'}
        </button>
      </div>
    </div>
  );
}
