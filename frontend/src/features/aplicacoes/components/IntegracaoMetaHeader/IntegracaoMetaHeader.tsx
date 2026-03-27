import { cn } from '../../../../lib/cn.ts';

interface IntegracaoMetaHeaderProps {
  metaOpen: boolean;
  onToggleOpen: () => void;
  isMetaConfigured: boolean;
  metaMode: string;
  metaAccessToken: string;
}

export function IntegracaoMetaHeader({ metaOpen, onToggleOpen, isMetaConfigured, metaMode, metaAccessToken }: IntegracaoMetaHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggleOpen}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3.5 transition-colors text-left',
        metaOpen ? 'bg-[var(--bg-surface-1)]' : 'bg-[var(--bg-base)] hover:bg-[var(--bg-surface-1)]',
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(24,119,242,0.15)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877f2" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">Meta Ads</span>
            {isMetaConfigured && <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] flex-shrink-0" />}
            {metaMode === 'capi' && metaAccessToken && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,92,252,0.15)', color: 'var(--accent)' }}>CAPI</span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)]">Facebook · Instagram · Audience Network</p>
        </div>
      </div>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={cn('text-[var(--text-tertiary)] transition-transform flex-shrink-0', metaOpen ? 'rotate-180' : '')}>
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
