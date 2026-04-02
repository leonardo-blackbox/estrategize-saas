import { cn } from '../../../../lib/cn.ts';
import { SaveStatusIndicator } from '../SaveStatusIndicator/index.ts';
import type { Application } from '../../../../api/applications.ts';

interface ShellTopbarActionsProps {
  application: Application | undefined;
  isEditorTab: boolean;
  status: 'draft' | 'published' | 'archived';
  publicUrl: string;
  publishIsPending: boolean;
  onPublishToggle: () => void;
  onCopyLink: () => void;
}

export function ShellTopbarActions({
  application,
  isEditorTab,
  status,
  publicUrl,
  publishIsPending,
  onPublishToggle,
  onCopyLink,
}: ShellTopbarActionsProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {isEditorTab && <SaveStatusIndicator />}

      {application && (
        <a
          href={status === 'published' ? publicUrl : `${publicUrl}?preview=1`}
          target="_blank"
          rel="noopener noreferrer"
          title={status === 'published' ? 'Ver formulario publico' : 'Previa do rascunho'}
          className={cn(
            'inline-flex items-center gap-1.5 px-2 h-[30px] rounded-md text-[12px] font-medium cursor-pointer',
            'border transition-all duration-150 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            'border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
          )}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 7s2-4.5 6-4.5S13 7 13 7s-2 4.5-6 4.5S1 7 1 7z" stroke="currentColor" strokeWidth="1.4" fill="none" />
            <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
          <span className="hidden sm:inline">{status === 'published' ? 'Ver' : 'Previa'}</span>
        </a>
      )}

      {application && (
        <button
          onClick={onCopyLink}
          className={cn(
            'w-[30px] h-[30px] flex items-center justify-center rounded-md cursor-pointer',
            'border border-[var(--border-hairline)] text-[var(--text-secondary)]',
            'hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
            'transition-all duration-150 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
          )}
          aria-label="Copiar link do formulario"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 1l4 3-4 3M13 4H5a3 3 0 000 6h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {application && (
        <button
          onClick={onPublishToggle}
          disabled={publishIsPending}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 h-[30px] rounded-md text-[12px] font-semibold cursor-pointer',
            'transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            status === 'published'
              ? 'bg-[rgba(48,209,88,0.1)] text-[#30d158] border border-[rgba(48,209,88,0.25)] hover:bg-[rgba(48,209,88,0.18)]'
              : 'bg-[var(--accent)] text-white hover:opacity-90 shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
          )}
        >
          {publishIsPending ? (
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : status === 'published' ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
          <span>{status === 'published' ? 'Publicado' : 'Publicar'}</span>
        </button>
      )}
    </div>
  );
}
