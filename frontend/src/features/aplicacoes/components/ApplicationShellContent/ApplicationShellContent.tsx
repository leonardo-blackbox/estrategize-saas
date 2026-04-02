import { useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useApplicationShell } from '../../hooks/useApplicationShell.ts';
import type { ApplicationShellContext } from '../../hooks/useApplicationShell.ts';
import { ShellTopbar } from '../ShellTopbar/index.ts';
import { ShellToast } from '../ShellToast/index.ts';

export function ApplicationShellContent() {
  const navigate = useNavigate();
  const shell = useApplicationShell();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      <ShellTopbar
        id={shell.id}
        application={shell.application}
        isLoading={shell.isLoading}
        isEditorTab={shell.isEditorTab}
        activeTab={shell.activeTab}
        status={shell.status}
        publicUrl={shell.publicUrl}
        publishIsPending={shell.publishMutation.isPending}
        onBack={() => navigate('/aplicacoes')}
        onTitleSave={(v) => shell.titleMutation.mutate(v)}
        onPublishToggle={shell.handlePublishToggle}
        onCopyLink={shell.handleCopyLink}
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet
          context={{
            application: shell.application,
            isLoading: shell.isLoading,
            refetch: shell.refetch,
          } satisfies ApplicationShellContext}
        />
      </div>

      <AnimatePresence>
        {shell.toast && (
          <ShellToast
            message={shell.toast.message}
            link={shell.toast.link}
            onDismiss={() => shell.setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
