import { useState, useRef, useCallback } from 'react';
import { cn } from '../../../../lib/cn';
import { fmtDate } from '../../utils/analytics-dates';
import { AnalyticsCalendarPicker } from '../AnalyticsCalendarPicker';
import type { FilterOption, DateRange } from '../../types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'all',    label: 'Total' },
  { key: 'today',  label: 'Hoje' },
  { key: '7d',     label: 'Ult. 7 dias' },
  { key: '30d',    label: 'Ult. 30 dias' },
  { key: 'custom', label: 'Personalizado' },
];

// ─── FilterBar ────────────────────────────────────────────────────────────────

interface AnalyticsFilterBarProps {
  active: FilterOption;
  customRange?: DateRange;
  onSelect: (opt: FilterOption) => void;
  onCustomApply: (range: DateRange) => void;
}

export function AnalyticsFilterBar({ active, customRange, onSelect, onCustomApply }: AnalyticsFilterBarProps) {
  const [calOpen, setCalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((opt: FilterOption) => {
    onSelect(opt);
    if (opt === 'custom') setCalOpen(true);
    else setCalOpen(false);
  }, [onSelect]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[12px] font-medium mr-1" style={{ color: 'var(--text-tertiary)' }}>Periodo:</span>
      {FILTER_OPTIONS.map((opt, i) => {
        const isActive = active === opt.key;
        return (
          <div key={opt.key} ref={opt.key === 'custom' ? wrapperRef : undefined} className="relative" style={{ marginRight: i === 0 ? 8 : 0 }}>
            {i === 0 && <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 h-4 w-px" style={{ background: 'var(--border-hairline)' }} />}
            <button onClick={() => handleSelect(opt.key)}
              className={cn('px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap', isActive ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')}
              style={{ background: isActive ? '#7c5cfc' : 'var(--bg-surface-1)', border: `1px solid ${isActive ? 'transparent' : 'var(--border-hairline)'}`, boxShadow: isActive ? '0 2px 8px rgba(124,92,252,0.35)' : undefined }}>
              {opt.key === 'custom' && customRange && active === 'custom'
                ? `${fmtDate(customRange.from)} – ${fmtDate(customRange.to)}`
                : opt.label}
            </button>
            {opt.key === 'custom' && calOpen && (
              <AnalyticsCalendarPicker value={customRange}
                onApply={(range) => { onCustomApply(range); setCalOpen(false); }}
                onClose={() => { setCalOpen(false); if (active === 'custom' && !customRange) onSelect('30d'); }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
