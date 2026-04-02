import type { Consultancy } from '../../../services/consultorias.api.ts';
import { relativeFuture } from '../../../consultorias.helpers.ts';

interface CardFooterProps {
  consultancy: Consultancy;
}

export function CardFooter({ consultancy: c }: CardFooterProps) {
  return (
    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
      {c.niche && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            background: 'var(--bg-surface-2)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-hairline)',
          }}
        >
          {c.niche}
        </span>
      )}
      {c.next_meeting_at && (
        <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          <svg className="h-2.5 w-2.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {relativeFuture(c.next_meeting_at)}
        </span>
      )}
      {c.credits_spent > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <svg className="h-2.5 w-2.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
          {c.credits_spent}
        </span>
      )}
      {c.priority === 'at_risk' && (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ml-auto"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          Em risco
        </span>
      )}
      {c.priority === 'high' && (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ml-auto"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          Alta prioridade
        </span>
      )}
    </div>
  );
}
