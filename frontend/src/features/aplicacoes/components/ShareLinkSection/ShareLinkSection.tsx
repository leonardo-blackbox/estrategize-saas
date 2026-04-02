import { useState } from 'react';
import { cn } from '../../../../lib/cn.ts';

interface ShareLinkSectionProps {
  publicUrl: string;
  applicationTitle: string;
}

export function ShareLinkSection({ publicUrl, applicationTitle }: ShareLinkSectionProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => null);
  }

  return (
    <section>
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">Link</h3>
      <p className="text-[12px] text-[var(--text-secondary)] mb-3">
        Envie esse link por e-mail, ou compartilhe nas suas redes sociais.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={publicUrl}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className={cn(
            'flex-1 min-w-0 px-3 py-2 rounded-lg text-[12px] font-mono cursor-text',
            'bg-[var(--bg-base)] border border-[var(--border-hairline)]',
            'text-[var(--text-secondary)]',
            'focus:outline-none focus:border-[var(--accent)] transition-colors duration-150',
          )}
        />
        <button
          onClick={handleCopyLink}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer',
            'transition-all duration-150 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            copied
              ? 'bg-[rgba(48,209,88,0.12)] text-[#30d158] border border-[rgba(48,209,88,0.25)]'
              : 'bg-[var(--accent)] text-white hover:opacity-90 shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
          )}
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${applicationTitle || 'Formulario'}: ${publicUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-[var(--text-tertiary)] hover:text-[#25D366] transition-colors flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 0.5a5.5 5.5 0 014.58 8.56L12 11.5l-2.52-0.66A5.5 5.5 0 116 0.5z" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
          </svg>
          WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(applicationTitle || 'Formulario')}&url=${encodeURIComponent(publicUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7 1l4 3-4 3M11 4H3a2 2 0 000 4h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Twitter/X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-[var(--text-tertiary)] hover:text-[#0A66C2] transition-colors flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7 1l4 3-4 3M11 4H3a2 2 0 000 4h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          LinkedIn
        </a>
      </div>
    </section>
  );
}
