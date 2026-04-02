import { cn } from '../../../../lib/cn.ts';
import { InlineTitle } from '../InlineTitle/index.ts';
import { ShellTopbarActions } from './ShellTopbarActions.tsx';
import { ShellTopbarTabs } from './ShellTopbarTabs.tsx';
import type { TabId } from '../../hooks/useApplicationShell.ts';
import type { Application } from '../../../../api/applications.ts';

interface ShellTopbarProps {
  id: string | undefined;
  application: Application | undefined;
  isLoading: boolean;
  isEditorTab: boolean;
  activeTab: TabId;
  status: 'draft' | 'published' | 'archived';
  publicUrl: string;
  publishIsPending: boolean;
  onBack: () => void;
  onTitleSave: (v: string) => void;
  onPublishToggle: () => void;
  onCopyLink: () => void;
}

export function ShellTopbar({
  id, application, isLoading, isEditorTab, activeTab,
  status, publicUrl, publishIsPending,
  onBack, onTitleSave, onPublishToggle, onCopyLink,
}: ShellTopbarProps) {
  return (
    <div style={{ background: 'var(--bg-surface-1)', borderBottom: '1px solid var(--border-hairline)', flexShrink: 0, zIndex: 40 }}>
      <div className="flex items-center gap-2 px-3 h-12">
        <button
          onClick={onBack}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-md shrink-0 cursor-pointer',
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
            'transition-all duration-150 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          )}
          aria-label="Voltar para Aplicacoes"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[var(--border-default)] shrink-0 text-[16px] opacity-40">/</span>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="h-4 w-32 rounded animate-pulse bg-[var(--bg-hover)]" />
          ) : (
            <InlineTitle value={application?.title ?? ''} onSave={onTitleSave} />
          )}
        </div>

        <ShellTopbarActions
          application={application}
          isEditorTab={isEditorTab}
          status={status}
          publicUrl={publicUrl}
          publishIsPending={publishIsPending}
          onPublishToggle={onPublishToggle}
          onCopyLink={onCopyLink}
        />
      </div>

      <ShellTopbarTabs id={id} activeTab={activeTab} application={application} />
    </div>
  );
}
