import { useRef } from 'react';
import { cn } from '../../../../lib/cn.ts';
import { TABS, type TabKey } from '../../consultorias.detail.types.ts';

interface ConsultoriaDetailTabsProps {
  active: TabKey;
  onChange: (t: TabKey) => void;
}

export function ConsultoriaDetailTabs({ active, onChange }: ConsultoriaDetailTabsProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="flex gap-0 border-b border-[var(--border-hairline)] overflow-x-auto scrollbar-none">
      {TABS.map((tab) => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          className={cn(
            'px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap border-b-2 -mb-px shrink-0',
            active === tab.key
              ? 'border-[var(--consulting-iris,#7c5cfc)] text-[var(--consulting-iris,#7c5cfc)]'
              : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
          )}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
