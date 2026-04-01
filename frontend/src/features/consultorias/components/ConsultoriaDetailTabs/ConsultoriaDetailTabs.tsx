import { useRef } from 'react';
import { cn } from '../../../../lib/cn.ts';
import { type TabKey, type TabDef } from '../../consultorias.detail.types.ts';

interface ConsultoriaDetailTabsProps {
  active: TabKey;
  tabs: TabDef[];
  onChange: (t: TabKey) => void;
  onInstallPlugin: () => void;
}

export function ConsultoriaDetailTabs({
  active,
  tabs,
  onChange,
  onInstallPlugin,
}: ConsultoriaDetailTabsProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="flex gap-0 border-b border-[var(--border-hairline)] overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap border-b-2 -mb-px shrink-0',
            active === tab.key
              ? 'border-[var(--consulting-iris,#7c5cfc)] text-[var(--consulting-iris,#7c5cfc)]'
              : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
          )}
        >
          {tab.label}
        </button>
      ))}

      {/* Plugin installer button */}
      <button
        onClick={onInstallPlugin}
        title="Instalar plugin"
        className="px-3 py-2.5 border-b-2 border-transparent -mb-px shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
