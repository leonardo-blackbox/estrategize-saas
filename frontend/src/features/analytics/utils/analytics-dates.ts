import type { FilterOption, DateRange } from '../types';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getRange(filter: FilterOption, custom?: DateRange): DateRange {
  const t = todayStr();
  switch (filter) {
    case 'all':    return { from: '2024-01-01', to: t };
    case 'today':  return { from: t, to: t };
    case '7d':     return { from: offsetDate(-6), to: t };
    case '30d':    return { from: offsetDate(-29), to: t };
    case 'custom': return custom ?? { from: t, to: t };
  }
}

export function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
