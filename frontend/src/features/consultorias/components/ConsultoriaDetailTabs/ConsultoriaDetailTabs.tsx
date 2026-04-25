import { useRef } from 'react';
import { motion } from 'framer-motion';
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
    <div
      ref={ref}
      className="consult-glass flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none"
      style={{ borderRadius: 9999 }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'relative px-3.5 py-1.5 text-[12px] font-medium whitespace-nowrap shrink-0 rounded-full',
              'transition-colors duration-200',
              isActive
                ? 'text-[var(--accent-text)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="active-tab-pill"
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'var(--accent)',
                  boxShadow: '0 4px 16px -4px color-mix(in srgb, var(--accent) 60%, transparent), inset 0 1px 0 0 rgba(255,255,255,0.15)',
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}

      <div className="w-px h-5 bg-[var(--border-hairline)] mx-1 shrink-0" />

      <button
        onClick={onInstallPlugin}
        title="Instalar plugin"
        className="px-2.5 py-1.5 rounded-full shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,white_6%,transparent)] transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
