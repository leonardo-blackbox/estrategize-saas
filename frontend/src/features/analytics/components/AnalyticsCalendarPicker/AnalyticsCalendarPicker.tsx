import { useState, useRef, useEffect } from 'react';
import { todayStr } from '../../utils/analytics-dates';
import type { DateRange } from '../../types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function calendarDays(year: number, month: number): Array<string | null> {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return cells;
}

// ─── CalendarPicker ───────────────────────────────────────────────────────────

interface AnalyticsCalendarPickerProps {
  value?: DateRange;
  onApply: (range: DateRange) => void;
  onClose: () => void;
}

export function AnalyticsCalendarPicker({ value, onApply, onClose }: AnalyticsCalendarPickerProps) {
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [start, setStart] = useState(value?.from ?? '');
  const [end,   setEnd]   = useState(value?.to   ?? '');
  const [hover, setHover] = useState<string | null>(null);
  const [phase, setPhase] = useState<'start' | 'end'>('start');
  const ref = useRef<HTMLDivElement>(null);
  const today = todayStr();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function clickDay(day: string) {
    if (phase === 'start') { setStart(day); setEnd(''); setPhase('end'); }
    else {
      if (day < start) { setStart(day); setPhase('end'); }
      else { setEnd(day); setPhase('start'); }
    }
  }

  function isInRange(day: string) {
    const e = end || hover || '';
    if (!start) return false;
    const lo = start < e ? start : e;
    const hi = start < e ? e : start;
    return day > lo && day < hi;
  }

  const isRangeEdge = (day: string) => day === start || day === (end || hover || '');
  const days = calendarDays(viewYear, viewMonth);
  const canApply = Boolean(start);

  function handleApply() {
    if (start && end) onApply({ from: start < end ? start : end, to: start < end ? end : start });
    else if (start) onApply({ from: start, to: start });
  }

  return (
    <div ref={ref} style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)', borderRadius: 16, padding: 20, width: 300, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-base)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{MONTHS_PT[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-base)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium py-1" style={{ color: 'var(--text-tertiary)' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const isEdge   = isRangeEdge(day);
          const isFuture = day > today;
          return (
            <button key={day} disabled={isFuture} onClick={() => !isFuture && clickDay(day)}
              onMouseEnter={() => { if (phase === 'end') setHover(day); }} onMouseLeave={() => setHover(null)}
              className="relative w-full aspect-square flex items-center justify-center text-[12px] rounded-lg transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
              style={{ background: isEdge ? '#7c5cfc' : isInRange(day) ? 'rgba(124,92,252,0.15)' : 'transparent', color: isEdge ? '#fff' : isFuture ? 'var(--text-tertiary)' : 'var(--text-primary)', fontWeight: day === today && !isEdge ? 600 : undefined }}>
              {day === today && !isEdge && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: '#7c5cfc' }} />}
              {day.slice(8)}
            </button>
          );
        })}
      </div>

      <div className="my-4" style={{ borderTop: '1px solid var(--border-hairline)' }} />

      {/* Text inputs */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <p className="text-[10px] text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">De</p>
          <input type="date" value={start} max={today} onChange={e => { setStart(e.target.value); setPhase('end'); }} className="w-full text-[12px] px-2.5 py-1.5 rounded-lg outline-none" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)', color: 'var(--text-primary)', colorScheme: 'dark' }} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">Ate</p>
          <input type="date" value={end} min={start} max={today} onChange={e => setEnd(e.target.value)} className="w-full text-[12px] px-2.5 py-1.5 rounded-lg outline-none" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)', color: 'var(--text-primary)', colorScheme: 'dark' }} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' }}>Cancelar</button>
        <button onClick={handleApply} disabled={!canApply} className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-opacity cursor-pointer disabled:opacity-40" style={{ background: '#7c5cfc', color: '#fff' }}>Aplicar</button>
      </div>
    </div>
  );
}
