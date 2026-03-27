import { useState } from 'react';
import { cn } from '../../../../lib/cn.ts';
import { IntegracaoMetaTestGuide } from '../IntegracaoMetaTestGuide';
import { IntegracaoMetaTestActions } from '../IntegracaoMetaTestActions';

interface IntegracaoMetaTestPanelProps {
  pixelId: string;
  publicUrl: string | undefined;
}

export function IntegracaoMetaTestPanel({ pixelId, publicUrl }: IntegracaoMetaTestPanelProps) {
  const [open, setOpen] = useState(false);
  const hasPixelId = pixelId.trim().length > 0;

  function handleOpenTestEvents() {
    const id = pixelId.trim();
    window.open(`https://www.facebook.com/events_manager2/list/pixel/${id}/test_events`, '_blank', 'noopener,noreferrer');
  }

  function handleOpenForm() {
    if (publicUrl) window.open(publicUrl, '_blank', 'noopener,noreferrer');
  }

  function handleTestBoth() {
    handleOpenTestEvents();
    setTimeout(() => handleOpenForm(), 400);
  }

  return (
    <div className="rounded-xl mb-3 overflow-hidden" style={{ border: '1px solid var(--border-hairline)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'text-[12px] font-semibold text-[var(--text-primary)]',
          'hover:bg-[var(--bg-surface-1)] transition-colors text-left',
        )}
        style={{ background: open ? 'var(--bg-surface-1)' : 'var(--bg-base)' }}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--accent)] flex-shrink-0">
            <path d="M5.5 1v6.5L2 13.5A1 1 0 0 0 2.914 15h10.172A1 1 0 0 0 14 13.5L10.5 7.5V1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 1h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Como testar se o pixel está funcionando
        </div>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={cn('text-[var(--text-tertiary)] transition-transform', open ? 'rotate-180' : '')}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4" style={{ background: 'var(--bg-surface-1)', borderTop: '1px solid var(--border-hairline)' }}>
          <IntegracaoMetaTestGuide />
          <IntegracaoMetaTestActions
            hasPixelId={hasPixelId}
            publicUrl={publicUrl}
            onTestBoth={handleTestBoth}
            onOpenTestEvents={handleOpenTestEvents}
            onOpenForm={handleOpenForm}
          />
        </div>
      )}
    </div>
  );
}
