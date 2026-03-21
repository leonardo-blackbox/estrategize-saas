import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../../lib/cn.ts';
import { fetchAnalytics, applicationKeys } from '../../../api/applications.ts';
import type { AnalyticsLead, AnalyticsData } from '../../../api/applications.ts';
import type { ApplicationShellContext } from './ApplicationShell.tsx';

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterOption = 'all' | 'today' | '7d' | '30d' | 'custom';

interface DateRange { from: string; to: string }

// ─── Date Utilities ───────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getRange(filter: FilterOption, custom?: DateRange): DateRange {
  const t = todayStr();
  switch (filter) {
    case 'all':    return { from: '2024-01-01', to: t };
    case 'today':  return { from: t, to: t };
    case '7d':     return { from: offsetDate(-6), to: t };
    case '30d':    return { from: offsetDate(-29), to: t };
    case 'custom': return custom ?? { from: t, to: t };
  }
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Fixed Tooltip ────────────────────────────────────────────────────────────

function FixedTooltip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y - 10,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'none',
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 10,
        padding: '8px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: 130,
      }}
    >
      {children}
    </div>
  );
}

// ─── Calendar Picker ──────────────────────────────────────────────────────────

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

interface CalendarPickerProps {
  value?: DateRange;
  onApply: (range: DateRange) => void;
  onClose: () => void;
}

function CalendarPicker({ value, onApply, onClose }: CalendarPickerProps) {
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [start, setStart] = useState(value?.from ?? '');
  const [end,   setEnd]   = useState(value?.to   ?? '');
  const [hover, setHover] = useState<string | null>(null);
  const [phase, setPhase] = useState<'start' | 'end'>('start');
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
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
    if (phase === 'start') {
      setStart(day); setEnd(''); setPhase('end');
    } else {
      if (day < start) { setStart(day); setPhase('end'); }
      else { setEnd(day); setPhase('start'); }
    }
  }

  function isInRange(day: string) {
    const s = start;
    const e = end || hover || '';
    if (!s) return false;
    const lo = s < e ? s : e;
    const hi = s < e ? e : s;
    return day > lo && day < hi;
  }

  function isStart(day: string) { return day === start; }
  function isEnd(day: string)   { return day === (end || hover || ''); }
  function isRangeEdge(day: string) { return isStart(day) || isEnd(day); }

  const days = calendarDays(viewYear, viewMonth);
  const today = todayStr();

  function handleApply() {
    if (start && end) onApply({ from: start < end ? start : end, to: start < end ? end : start });
    else if (start) onApply({ from: start, to: start });
  }

  const canApply = Boolean(start);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 16,
        padding: 20,
        width: 300,
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
      }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-base)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          {MONTHS_PT[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-base)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium py-1" style={{ color: 'var(--text-tertiary)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const inRange  = isInRange(day);
          const isEdge   = isRangeEdge(day);
          const isToday  = day === today;
          const isFuture = day > today;
          return (
            <button
              key={day}
              disabled={isFuture}
              onClick={() => !isFuture && clickDay(day)}
              onMouseEnter={() => { if (phase === 'end') setHover(day); }}
              onMouseLeave={() => setHover(null)}
              className="relative w-full aspect-square flex items-center justify-center text-[12px] rounded-lg transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
              style={{
                background: isEdge
                  ? '#7c5cfc'
                  : inRange
                  ? 'rgba(124,92,252,0.15)'
                  : 'transparent',
                color: isEdge
                  ? '#fff'
                  : isFuture
                  ? 'var(--text-tertiary)'
                  : 'var(--text-primary)',
                fontWeight: isToday && !isEdge ? 600 : undefined,
              }}
            >
              {isToday && !isEdge && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: '#7c5cfc' }}
                />
              )}
              {day.slice(8)}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="my-4" style={{ borderTop: '1px solid var(--border-hairline)' }} />

      {/* Text inputs */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1">
          <p className="text-[10px] text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">De</p>
          <input
            type="date"
            value={start}
            max={today}
            onChange={e => { setStart(e.target.value); setPhase('end'); }}
            className="w-full text-[12px] px-2.5 py-1.5 rounded-lg outline-none"
            style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-primary)',
              colorScheme: 'dark',
            }}
          />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-[var(--text-tertiary)] mb-1 uppercase tracking-wider">Até</p>
          <input
            type="date"
            value={end}
            min={start}
            max={today}
            onChange={e => setEnd(e.target.value)}
            className="w-full text-[12px] px-2.5 py-1.5 rounded-lg outline-none"
            style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-primary)',
              colorScheme: 'dark',
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' }}
        >
          Cancelar
        </button>
        <button
          onClick={handleApply}
          disabled={!canApply}
          className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-opacity cursor-pointer disabled:opacity-40"
          style={{ background: '#7c5cfc', color: '#fff' }}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'all',    label: 'Total' },
  { key: 'today',  label: 'Hoje' },
  { key: '7d',     label: 'Últ. 7 dias' },
  { key: '30d',    label: 'Últ. 30 dias' },
  { key: 'custom', label: 'Personalizado' },
];

interface FilterBarProps {
  active: FilterOption;
  customRange?: DateRange;
  onSelect: (opt: FilterOption) => void;
  onCustomApply: (range: DateRange) => void;
}

function FilterBar({ active, customRange, onSelect, onCustomApply }: FilterBarProps) {
  const [calOpen, setCalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((opt: FilterOption) => {
    onSelect(opt);
    if (opt === 'custom') setCalOpen(true);
    else setCalOpen(false);
  }, [onSelect]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[12px] font-medium mr-1" style={{ color: 'var(--text-tertiary)' }}>Período:</span>

      {FILTER_OPTIONS.map((opt, i) => {
        const isActive = active === opt.key;
        const isSeparated = i === 0; // "Total" gets extra right margin

        return (
          <div
            key={opt.key}
            ref={opt.key === 'custom' ? wrapperRef : undefined}
            className="relative"
            style={{ marginRight: isSeparated ? 8 : 0 }}
          >
            {isSeparated && (
              <div
                className="absolute right-[-10px] top-1/2 -translate-y-1/2 h-4 w-px"
                style={{ background: 'var(--border-hairline)' }}
              />
            )}
            <button
              onClick={() => handleSelect(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap',
                isActive
                  ? 'text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )}
              style={{
                background: isActive ? '#7c5cfc' : 'var(--bg-surface-1)',
                border: `1px solid ${isActive ? 'transparent' : 'var(--border-hairline)'}`,
                boxShadow: isActive ? '0 2px 8px rgba(124,92,252,0.35)' : undefined,
              }}
            >
              {opt.key === 'custom' && customRange && active === 'custom'
                ? `${fmtDate(customRange.from)} – ${fmtDate(customRange.to)}`
                : opt.label}
            </button>

            {/* Calendar popover */}
            {opt.key === 'custom' && calOpen && (
              <CalendarPicker
                value={customRange}
                onApply={(range) => { onCustomApply(range); setCalOpen(false); }}
                onClose={() => { setCalOpen(false); if (active === 'custom' && !customRange) onSelect('30d'); }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, suffix = '', color }: { label: string; value: number | string; suffix?: string; color?: string }) {
  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <p className="text-[11px] font-medium text-[var(--text-tertiary)] mb-2 uppercase tracking-wider">{label}</p>
      <p className="text-[28px] font-bold tracking-tight" style={{ color: color || 'var(--text-primary)', lineHeight: 1 }}>
        {value}
        {suffix && <span className="text-[16px] ml-1 opacity-60">{suffix}</span>}
      </p>
    </div>
  );
}

// ─── Funnel Bar ───────────────────────────────────────────────────────────────

function FunnelBar({ label, value, max, rate, color }: { label: string; value: number; max: number; rate: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-[var(--text-secondary)]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono text-[var(--text-tertiary)]">{value}</span>
          <span className="text-[12px] font-semibold" style={{ color }}>{rate}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'var(--border-hairline)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Daily Bar Chart ──────────────────────────────────────────────────────────

function DailyBarChart({ timeline }: { timeline: Array<{ date: string; views: number; starts: number; submits: number }> }) {
  const maxVal = useMemo(() => Math.max(...timeline.map((d) => d.views), 1), [timeline]);
  const [tooltip, setTooltip] = useState<{ date: string; x: number; y: number } | null>(null);

  if (timeline.length === 0) return null;
  const visible = timeline.length > 60 ? timeline.slice(-60) : timeline;

  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Eventos por dia</h3>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#7c5cfc' }} />views</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#3b82f6' }} />inícios</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#30d158' }} />envios</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex items-end gap-[2px] pb-1" style={{ minHeight: 80, minWidth: visible.length * 18 }}>
          {visible.map((day) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center cursor-default"
              style={{ minWidth: 14 }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ date: day.date, x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: Math.max(2, (day.views / maxVal) * 72),
                  background: tooltip?.date === day.date ? '#a07cfe' : '#7c5cfc',
                  opacity: 0.9,
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
              >
                {day.starts > 0 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(day.starts / Math.max(day.views, 1)) * 100}%`, background: '#3b82f6', borderRadius: '2px 2px 0 0', opacity: 0.9 }} />
                )}
                {day.submits > 0 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(day.submits / Math.max(day.views, 1)) * 100}%`, background: '#30d158', borderRadius: '2px 2px 0 0', opacity: 0.9 }} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* X axis */}
        <div className="flex" style={{ minWidth: visible.length * 18 }}>
          {visible.map((day, i) => {
            const step = visible.length <= 14 ? 1 : visible.length <= 30 ? 3 : 7;
            return (
              <div key={day.date} className="flex-1 text-center" style={{ minWidth: 14 }}>
                {i % step === 0 && (
                  <span className="text-[9px] text-[var(--text-tertiary)]">
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'numeric' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed tooltip — escapes all overflow clipping */}
      {tooltip && (() => {
        const day = visible.find(d => d.date === tooltip.date);
        if (!day) return null;
        return (
          <FixedTooltip x={tooltip.x} y={tooltip.y}>
            <p className="text-[11px] font-semibold text-[var(--text-primary)] mb-1">{fmtDate(day.date)}</p>
            <p className="text-[11px]" style={{ color: '#7c5cfc' }}>{day.views} views</p>
            <p className="text-[11px]" style={{ color: '#3b82f6' }}>{day.starts} inícios</p>
            <p className="text-[11px]" style={{ color: '#30d158' }}>{day.submits} envios</p>
          </FixedTooltip>
        );
      })()}
    </div>
  );
}

// ─── Hourly Heatmap ───────────────────────────────────────────────────────────

function HourlyHeatmap({ hourly }: { hourly: Array<{ hour: number; views: number; starts: number; submits: number }> }) {
  const maxViews = useMemo(() => Math.max(...hourly.map((h) => h.views), 1), [hourly]);
  const [tooltip, setTooltip] = useState<{ hour: number; x: number; y: number } | null>(null);

  return (
    <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-0.5">Picos por horário (UTC)</h3>
      <p className="text-[11px] text-[var(--text-tertiary)] mb-4">Distribuição de visualizações nas 24h</p>
      <div className="overflow-x-auto">
        <div className="flex items-end gap-[3px]" style={{ minHeight: 60, minWidth: 24 * 22 }}>
          {hourly.map((h) => {
            const pct = (h.views / maxViews) * 100;
            const barColor = pct > 60 ? '#ff6b6b' : pct > 30 ? '#ffb347' : '#7c5cfc';
            return (
              <div
                key={h.hour}
                className="flex-1 flex flex-col items-center cursor-default"
                style={{ minWidth: 18 }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ hour: h.hour, x: rect.left + rect.width / 2, y: rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <div
                  className="w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height: Math.max(3, (h.views / maxViews) * 52),
                    background: tooltip?.hour === h.hour ? '#a07cfe' : barColor,
                    opacity: h.views === 0 ? 0.15 : 0.85,
                  }}
                />
                <span className="text-[8px] text-[var(--text-tertiary)] mt-1">{String(h.hour).padStart(2, '0')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {tooltip && (() => {
        const h = hourly.find(x => x.hour === tooltip.hour);
        if (!h) return null;
        return (
          <FixedTooltip x={tooltip.x} y={tooltip.y}>
            <p className="text-[11px] font-semibold text-[var(--text-primary)] mb-1">{String(h.hour).padStart(2, '0')}:00 – {String(h.hour + 1).padStart(2, '0')}:00</p>
            <p className="text-[11px] text-[var(--text-secondary)]">{h.views} views · {h.starts} inícios · {h.submits} envios</p>
          </FixedTooltip>
        );
      })()}
    </div>
  );
}

// ─── UTM Section (Pie + Breakdown com toggle compartilhado) ──────────────────

type UTMMode = 'leads' | 'views';

const PAID_SOURCES = /facebook|instagram|google|tiktok|youtube|twitter|linkedin|meta|ads/i;

function UTMToggle({ mode, onChange }: { mode: UTMMode; onChange: (m: UTMMode) => void }) {
  return (
    <div
      className="flex gap-0.5 p-0.5 rounded-lg"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)' }}
    >
      {(['leads', 'views'] as UTMMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
          style={{
            background: mode === m ? '#7c5cfc' : 'transparent',
            color: mode === m ? '#fff' : 'var(--text-tertiary)',
          }}
        >
          {m === 'leads' ? 'Leads' : 'Visualizações'}
        </button>
      ))}
    </div>
  );
}

function TrafficPieChart({
  traffic_split,
  mode,
  totalViews,
}: {
  traffic_split: AnalyticsData['traffic_split'];
  mode: UTMMode;
  totalViews: number;
}) {
  const { paid, organic, total } = traffic_split;
  if (total === 0 || paid === 0) return null;

  // Em modo views: estima proporcionalmente (distribuição de leads × total de views)
  const dispPaid    = mode === 'leads' ? paid    : Math.round((paid    / total) * totalViews);
  const dispOrganic = mode === 'leads' ? organic : totalViews - Math.round((paid / total) * totalViews);
  const dispTotal   = mode === 'leads' ? total   : totalViews;
  const paidPct     = dispTotal > 0 ? dispPaid / dispTotal : 0;
  const orgPct      = 1 - paidPct;

  const R = 52; const cx = 70; const cy = 70;
  const circ    = 2 * Math.PI * R;
  const paidDash = paidPct * circ;
  const orgDash  = orgPct  * circ;

  const unit = mode === 'leads' ? (dispTotal !== 1 ? 'leads' : 'lead') : 'views';

  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-0.5">Origem do tráfego</h3>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            {mode === 'leads'
              ? 'Com base nos leads convertidos no período'
              : 'Estimativa proporcional com base nos leads × total de views'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8 flex-wrap">
        <svg width={140} height={140} viewBox="0 0 140 140">
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(124,92,252,0.2)" strokeWidth={18} />
          <circle
            cx={cx} cy={cy} r={R} fill="none" stroke="#7c5cfc" strokeWidth={18}
            strokeDasharray={`${paidDash} ${circ - paidDash}`}
            strokeDashoffset={circ / 4} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <circle
            cx={cx} cy={cy} r={R} fill="none" stroke="rgba(124,92,252,0.35)" strokeWidth={18}
            strokeDasharray={`${orgDash} ${circ - orgDash}`}
            strokeDashoffset={circ / 4 - paidDash} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--text-primary)">
            {Math.round(paidPct * 100)}%
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">pago</text>
        </svg>

        <div className="flex flex-col gap-4 flex-1">
          {[
            { label: 'Tráfego pago', val: dispPaid, pct: paidPct, color: '#7c5cfc' },
            { label: 'Orgânico / Direto', val: dispOrganic, pct: orgPct, color: 'rgba(124,92,252,0.4)' },
          ].map(({ label, val, pct, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--text-primary)] font-medium">{label}</span>
                  <span className="text-[13px] font-bold text-[var(--text-primary)]">{val}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full" style={{ background: 'var(--border-hairline)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: color, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-[var(--text-tertiary)] pt-1" style={{ borderTop: '1px solid var(--border-hairline)' }}>
            {dispTotal} {unit} no período
          </p>
        </div>
      </div>
    </div>
  );
}

function UTMBreakdown({
  utm_breakdown,
  mode,
  totalViews,
}: {
  utm_breakdown: AnalyticsData['utm_breakdown'];
  mode: UTMMode;
  totalViews: number;
}) {
  if (utm_breakdown.length === 0) return null;

  const totalLeads = utm_breakdown.reduce((s, x) => s + x.count, 0);

  // Em modo views: estima views por fonte proporcionalmente
  const rows = utm_breakdown.map(({ source, count }) => ({
    source,
    count,
    display: mode === 'leads' ? count : Math.round((count / totalLeads) * totalViews),
  }));

  const maxDisplay = Math.max(...rows.map((r) => r.display), 1);
  const dispTotal  = mode === 'leads' ? totalLeads : totalViews;

  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}
    >
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-0.5">UTM Source — {mode === 'leads' ? 'leads' : 'views'} por origem</h3>
        <p className="text-[11px] text-[var(--text-tertiary)]">
          {mode === 'leads'
            ? 'Baseado nos leads convertidos (utm_source da URL)'
            : 'Estimativa de views por origem (proporcional à distribuição de leads)'}
        </p>
      </div>

      <div className="space-y-3">
        {rows.map(({ source, display }) => {
          const pct     = (display / maxDisplay) * 100;
          const sharePct = dispTotal > 0 ? Math.round((display / dispTotal) * 100) : 0;
          const isPaid   = PAID_SOURCES.test(source) && source !== '(direto / orgânico)';
          const barColor = isPaid ? '#7c5cfc' : 'rgba(124,92,252,0.4)';

          return (
            <div key={source}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {isPaid && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: 'rgba(124,92,252,0.15)', color: '#7c5cfc' }}>
                      pago
                    </span>
                  )}
                  <span className="text-[12px] text-[var(--text-primary)] font-medium">{source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-tertiary)]">{sharePct}%</span>
                  <span className="text-[12px] font-semibold text-[var(--text-primary)] w-7 text-right">{display}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'var(--border-hairline)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UTMSection({ data }: { data: AnalyticsData }) {
  const [mode, setMode] = useState<UTMMode>('leads');
  if (data.leads.length === 0 || data.traffic_split.paid === 0) return null;

  return (
    <div className="space-y-3">
      {/* Toggle header compartilhado */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--text-tertiary)]">Análise de origem</p>
        <UTMToggle mode={mode} onChange={setMode} />
      </div>
      <TrafficPieChart traffic_split={data.traffic_split} mode={mode} totalViews={data.views} />
      <UTMBreakdown utm_breakdown={data.utm_breakdown} mode={mode} totalViews={data.views} />
    </div>
  );
}

// ─── Leads Table ──────────────────────────────────────────────────────────────

function LeadsTable({ leads }: { leads: AnalyticsLead[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.utm_source?.toLowerCase().includes(q) ||
        l.utm_campaign?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  function copyAll() {
    const header = 'Nome\tEmail\tTelefone\tInstagram\tUTM Source\tUTM Campaign\tData';
    const rows = leads.map((l) => [l.name, l.email, l.phone, l.instagram, l.utm_source, l.utm_campaign, l.submitted_at].join('\t'));
    navigator.clipboard.writeText([header, ...rows].join('\n'));
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-hairline)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ background: 'var(--bg-surface-1)', borderBottom: '1px solid var(--border-hairline)' }}>
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Leads capturados</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{leads.length} {leads.length === 1 ? 'lead' : 'leads'} no período</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-[12px] outline-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)', color: 'var(--text-primary)', width: 130 }}
          />
          <button
            onClick={copyAll}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' }}
          >
            Copiar tudo
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="py-10 text-center" style={{ background: 'var(--bg-surface-1)' }}>
          <p className="text-[13px] text-[var(--text-tertiary)]">Nenhum lead capturado no período.</p>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ background: 'var(--bg-surface-1)' }}>
          <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                {['Nome', 'Email', 'Telefone', 'Origem', 'Campanha', 'Data'].map((col) => (
                  <th key={col} className="text-left px-4 py-2.5 font-medium text-[var(--text-tertiary)] text-[11px] uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <tr key={i} className="hover:bg-[var(--bg-base)] transition-colors" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                  <td className="px-4 py-3 text-[var(--text-primary)] font-medium max-w-[140px] truncate">
                    {lead.name || <span className="text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate">
                    {lead.email
                      ? <a href={`mailto:${lead.email}`} className="hover:underline" style={{ color: '#7c5cfc' }}>{lead.email}</a>
                      : <span className="text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] font-mono">
                    {lead.phone || <span className="text-[var(--text-tertiary)] font-sans">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {lead.utm_source
                      ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(124,92,252,0.15)', color: '#7c5cfc' }}>{lead.utm_source}</span>
                      : <span className="text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-tertiary)] max-w-[120px] truncate">{lead.utm_campaign || '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-tertiary)] whitespace-nowrap">{fmtDateTime(lead.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && search && (
            <p className="text-center py-6 text-[12px] text-[var(--text-tertiary)]">Nenhum resultado para "{search}"</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { application } = useOutletContext<ApplicationShellContext>();
  const [filter, setFilter]       = useState<FilterOption>('30d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const range = getRange(filter, customRange);

  const queryKey = [
    ...(applicationKeys.analytics?.(application?.id || '') || []),
    filter,
    filter === 'custom' ? JSON.stringify(customRange) : null,
  ];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchAnalytics(application!.id, '30d', range),
    enabled: Boolean(application?.id) && (filter !== 'custom' || Boolean(customRange)),
    staleTime: 60_000,
  });

  function handleFilterSelect(opt: FilterOption) {
    setFilter(opt);
    if (opt !== 'custom') setCustomRange(undefined);
  }

  function handleCustomApply(r: DateRange) {
    setCustomRange(r);
    setFilter('custom');
  }

  if (!application) return null;

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1">Analytics</h2>
            {data && (
              <p className="text-[11px] text-[var(--text-tertiary)]">
                {fmtDate(data.from)} – {fmtDate(data.to)}
              </p>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-6 relative">
          <FilterBar
            active={filter}
            customRange={customRange}
            onSelect={handleFilterSelect}
            onCustomApply={handleCustomApply}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="inline-block w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filter === 'custom' && !customRange ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-tertiary)] text-[14px]">Selecione o intervalo no calendário para visualizar os dados.</p>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard label="Visualizações" value={data.views} />
              <MetricCard label="Inícios" value={data.starts} />
              <MetricCard label="Envios" value={data.submits} />
              <MetricCard label="Total respostas" value={data.total_responses} color="#7c5cfc" />
            </div>

            {/* Funnel */}
            <div className="p-5 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4">Funil de conversão</h3>
              <div className="space-y-4">
                <FunnelBar label="Visualizações → Inícios" value={data.starts} max={data.views} rate={data.start_rate} color="#7c5cfc" />
                <FunnelBar label="Inícios → Envios" value={data.submits} max={data.starts} rate={data.completion_rate} color="#3b82f6" />
                <FunnelBar label="Visualizações → Envios (geral)" value={data.submits} max={data.views} rate={data.overall_rate} color="#30d158" />
              </div>
            </div>

            {/* Daily chart — oculto quando filtro é "hoje" */}
            {filter !== 'today' && data.timeline.length > 0 && <DailyBarChart timeline={data.timeline} />}

            {/* Hourly heatmap */}
            <HourlyHeatmap hourly={data.hourly} />

            {/* Origem de tráfego + UTM com toggle Leads / Visualizações */}
            <UTMSection data={data} />

            {/* Leads table */}
            <LeadsTable leads={data.leads} />

            {data.views === 0 && (
              <div className="text-center py-8">
                <p className="text-[var(--text-tertiary)] text-[14px] mb-1">Nenhum evento registrado no período</p>
                <p className="text-[var(--text-tertiary)] text-[12px]">Tente um período diferente ou publique o formulário para começar a rastrear.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--text-tertiary)] text-[14px]">Não foi possível carregar os dados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
