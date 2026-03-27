import type { ConsultancyPhase } from './services/consultorias.api.ts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function relativeFuture(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = then - now;
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffDay < 0) return 'Atrasado';
  if (diffDay === 0) return 'Hoje';
  if (diffDay === 1) return 'Amanhã';
  if (diffDay < 7) return `Em ${diffDay} dias`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortOption = 'recent' | 'priority' | 'progress' | 'alpha';
export type PhaseFilter = ConsultancyPhase | 'all';

export const PRIORITY_WEIGHT: Record<string, number> = {
  at_risk: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export const phaseFilterLabels: { value: PhaseFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'diagnosis', label: 'Diagnóstico' },
  { value: 'delivery', label: 'Entrega' },
  { value: 'implementation', label: 'Implementação' },
  { value: 'support', label: 'Suporte' },
  { value: 'closed', label: 'Encerrada' },
];
