import { cn } from '../../../../lib/cn.ts';
import { isDaysUrgent } from '../../../../lib/dates.ts';
import type { CourseStatus } from '../../formacao.types';

interface EntitlementBadgeProps {
  status: CourseStatus;
  requiredOffer?: string;
  dripDate?: string;
  expiryDate?: string;
  offerBadgeText?: string | null;
}

export function EntitlementBadge({ status, requiredOffer, dripDate, expiryDate, offerBadgeText }: EntitlementBadgeProps) {
  const isUrgent = status === 'expiring' && isDaysUrgent(expiryDate);
  const baseStyle = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border";

  if (status === 'locked') {
    return (
      <span className={cn(baseStyle, "bg-[var(--color-bg-primary)]/80 border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]")}>
        {offerBadgeText ?? requiredOffer ?? 'Bloqueado'}
      </span>
    );
  }
  if (status === 'drip') {
    return (
      <span className={cn(baseStyle, "bg-black/80 border-[var(--color-border-subtle)] text-[var(--color-text-primary)]")}>
        Libera {dripDate}
      </span>
    );
  }
  if (status === 'expiring') {
    return (
      <span className={cn(baseStyle, isUrgent ? "bg-black/80 border-[var(--color-text-primary)] text-[var(--color-text-primary)]" : "bg-black/60 border-[var(--color-border-subtle)] text-[var(--color-text-primary)]")}>
        Expira {expiryDate}
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className={cn(baseStyle, "bg-[var(--color-text-primary)]/10 border-[rgba(255,255,255,0.15)] text-[var(--color-text-primary)]")}>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Completo
      </span>
    );
  }
  return null;
}
