import { useRef, useEffect } from 'react';
import { cn } from '../../../../lib/cn.ts';

interface Props {
  isActive: boolean;
  isOpen: boolean;
  isPending: boolean;
  onToggle: () => void;
  onSelect: (active: boolean) => void;
  onClickOutside: () => void;
}

export function StatusDropdown({ isActive, isOpen, isPending, onToggle, onSelect, onClickOutside }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClickOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClickOutside]);

  const checkIcon = (
    <svg className="ml-auto h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );

  return (
    <div ref={ref} className="relative">
      <button onClick={onToggle} disabled={isPending}
        className={cn('flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded transition-colors',
          isActive ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25'
            : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]')}>
        {isActive ? 'Ativa' : 'Inativa'}
        <svg className={cn('h-2.5 w-2.5 transition-transform', isOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[110px] rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] shadow-lg overflow-hidden">
          <button onClick={() => onSelect(true)}
            className={cn('w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left',
              isActive ? 'text-emerald-500 bg-emerald-500/10' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]')}>
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? 'bg-emerald-500' : 'bg-[var(--text-muted)]')} />
            Ativo
            {isActive && <span className="ml-auto text-emerald-500">{checkIcon}</span>}
          </button>
          <div className="h-px bg-[var(--border-hairline)]" />
          <button onClick={() => onSelect(false)}
            className={cn('w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left',
              !isActive ? 'text-[var(--text-secondary)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]')}>
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', !isActive ? 'bg-[var(--text-tertiary)]' : 'bg-[var(--text-muted)]')} />
            Inativo
            {!isActive && <span className="ml-auto">{checkIcon}</span>}
          </button>
        </div>
      )}
    </div>
  );
}
