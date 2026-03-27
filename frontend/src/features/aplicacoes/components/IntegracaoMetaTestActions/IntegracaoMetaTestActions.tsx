import { cn } from '../../../../lib/cn.ts';

interface IntegracaoMetaTestActionsProps {
  hasPixelId: boolean;
  publicUrl: string | undefined;
  onTestBoth: () => void;
  onOpenTestEvents: () => void;
  onOpenForm: () => void;
}

export function IntegracaoMetaTestActions({ hasPixelId, publicUrl, onTestBoth, onOpenTestEvents, onOpenForm }: IntegracaoMetaTestActionsProps) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <button
        type="button"
        disabled={!hasPixelId}
        onClick={onTestBoth}
        className={cn(
          'w-full py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5',
          hasPixelId ? 'bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer' : 'bg-[var(--border-hairline)] text-[var(--text-tertiary)] cursor-not-allowed',
        )}
        title={!hasPixelId ? 'Preencha o ID do pixel e salve antes de testar' : undefined}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M5.5 1v6.5L2 13.5A1 1 0 0 0 2.914 15h10.172A1 1 0 0 0 14 13.5L10.5 7.5V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Testar pixel agora
      </button>
      <div className="flex gap-2">
        <button
          type="button" disabled={!hasPixelId} onClick={onOpenTestEvents}
          className={cn('flex-1 py-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1', hasPixelId ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer' : 'text-[var(--text-tertiary)] cursor-not-allowed')}
          style={{ border: '1px solid var(--border-hairline)', background: 'var(--bg-base)' }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M7 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 2h4v4M14 2l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Events Manager
        </button>
        {publicUrl && (
          <button
            type="button" onClick={onOpenForm}
            className={cn('flex-1 py-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1', 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer')}
            style={{ border: '1px solid var(--border-hairline)', background: 'var(--bg-base)' }}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Abrir formulário
          </button>
        )}
      </div>
    </div>
  );
}
