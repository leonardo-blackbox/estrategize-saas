import { NavLink } from 'react-router-dom';
import { cn } from '../../../../lib/cn.ts';
import { TABS } from '../../hooks/useApplicationShell.ts';
import type { TabId } from '../../hooks/useApplicationShell.ts';
import type { Application } from '../../../../api/applications.ts';

interface ShellTopbarTabsProps {
  id: string | undefined;
  activeTab: TabId;
  application: Application | undefined;
}

export function ShellTopbarTabs({ id, activeTab, application }: ShellTopbarTabsProps) {
  return (
    <nav
      className="flex items-end justify-center h-10 px-1 overflow-x-auto scrollbar-none"
      style={{ borderTop: '1px solid var(--border-hairline)' }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <NavLink
            key={tab.id}
            to={`/aplicacoes/${id}/${tab.id}`}
            className={cn(
              'relative px-3 h-full flex items-center gap-1.5 text-[12px] font-medium select-none whitespace-nowrap shrink-0',
              'transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm',
              'after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[2px]',
              'after:rounded-full after:transition-all after:duration-200',
              isActive
                ? 'text-[var(--text-primary)] after:bg-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] after:bg-transparent hover:after:bg-[var(--border-hairline)]',
            )}
          >
            {tab.label}
            {tab.id === 'respostas' && application && application.response_count > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold tabular-nums',
                  isActive
                    ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]',
                )}
              >
                {application.response_count}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
