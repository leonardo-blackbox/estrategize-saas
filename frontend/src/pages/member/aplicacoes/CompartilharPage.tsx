import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import QRCode from 'qrcode';
import { cn } from '../../../lib/cn.ts';
import type { ApplicationShellContext } from './ApplicationShell.tsx';

// ─── Embed type options ───────────────────────────────────────────────────────
type EmbedType = 'normal' | 'popup' | 'slider';
type WidthUnit = '%' | 'px';

const EMBED_LABELS: Record<EmbedType, string> = {
  normal: 'Normal',
  popup: 'Popup',
  slider: 'Slider',
};

function generateEmbedCode(
  slug: string,
  type: EmbedType,
  width: number,
  widthUnit: WidthUnit,
  height: number,
): string {
  const url = `${window.location.origin}/f/${slug}`;
  if (type === 'normal') {
    return `<iframe\n  src="${url}"\n  width="${width}${widthUnit}"\n  height="${height}px"\n  frameborder="0"\n  allow="clipboard-write"\n  style="border:none;border-radius:8px;"\n></iframe>`;
  }
  return `<!-- Embed tipo "${type}" — em breve -->\n<a href="${url}" target="_blank">Abrir formulário</a>`;
}

export default function CompartilharPage() {
  const { application, isLoading } = useOutletContext<ApplicationShellContext>();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState<EmbedType>('normal');
  const [embedWidth, setEmbedWidth] = useState(100);
  const [embedWidthUnit, setEmbedWidthUnit] = useState<WidthUnit>('%');
  const [embedHeight, setEmbedHeight] = useState(600);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const publicUrl = application ? `${window.location.origin}/f/${application.slug}` : '';

  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(publicUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#7c5cfc', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {});
  }, [publicUrl]);

  function handleCopyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => null);
  }

  function handleGenerateCode() {
    if (!application) return;
    const code = generateEmbedCode(application.slug, embedType, embedWidth, embedWidthUnit, embedHeight);
    setGeneratedCode(code);
    setCodeCopied(false);
  }

  function handleCopyCode() {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }).catch(() => null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="inline-block w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left panel ── */}
      <div
        className="w-[340px] flex-shrink-0 overflow-y-auto"
        style={{
          borderRight: '1px solid var(--border-hairline)',
          background: 'var(--bg-surface-1)',
        }}
      >
        <div className="p-6 space-y-8">
          {/* Link section */}
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
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${application?.title || 'Formulário'}: ${publicUrl}`)}`}
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
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(application?.title || 'Formulário')}&url=${encodeURIComponent(publicUrl)}`}
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

          <div style={{ height: 1, background: 'var(--border-hairline)' }} />

          {/* Embed section */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                Código de incorporação
              </h3>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium',
                  'bg-[var(--bg-hover)] text-[var(--text-tertiary)]',
                )}
              >
                ℹ
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] mb-4">
              Adicionar o formulário no seu site
            </p>

            {/* Embed type dropdown */}
            <div className="mb-4">
              <select
                value={embedType}
                onChange={(e) => setEmbedType(e.target.value as EmbedType)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-[13px]',
                  'bg-[var(--bg-base)] border border-[var(--border-hairline)]',
                  'text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]',
                  'transition-colors duration-150',
                )}
              >
                {(Object.keys(EMBED_LABELS) as EmbedType[]).map((t) => (
                  <option key={t} value={t}>{EMBED_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Width */}
            <div className="flex items-center gap-3 mb-3">
              <label className="text-[13px] text-[var(--text-secondary)] w-16 flex-shrink-0">
                Largura
              </label>
              <input
                type="number"
                value={embedWidth}
                onChange={(e) => setEmbedWidth(Number(e.target.value))}
                min={1}
                max={9999}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-[13px]',
                  'bg-[var(--bg-base)] border border-[var(--border-hairline)]',
                  'text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]',
                  'transition-colors',
                )}
              />
              <select
                value={embedWidthUnit}
                onChange={(e) => setEmbedWidthUnit(e.target.value as WidthUnit)}
                className={cn(
                  'w-16 px-2 py-2 rounded-lg text-[13px]',
                  'bg-[var(--bg-base)] border border-[var(--border-hairline)]',
                  'text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]',
                  'transition-colors',
                )}
              >
                <option value="%">%</option>
                <option value="px">px</option>
              </select>
            </div>

            {/* Height */}
            <div className="flex items-center gap-3 mb-5">
              <label className="text-[13px] text-[var(--text-secondary)] w-16 flex-shrink-0">
                Altura
              </label>
              <input
                type="number"
                value={embedHeight}
                onChange={(e) => setEmbedHeight(Number(e.target.value))}
                min={100}
                max={9999}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-[13px]',
                  'bg-[var(--bg-base)] border border-[var(--border-hairline)]',
                  'text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]',
                  'transition-colors',
                )}
              />
              <span className="w-16 text-[13px] text-center text-[var(--text-secondary)]">px</span>
            </div>

            <button
              onClick={handleGenerateCode}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer',
                'bg-[var(--accent)] text-white hover:opacity-90',
                'transition-all duration-150 active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-surface-1)]',
                'shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
              )}
            >
              Gerar código
            </button>

            {/* Generated code */}
            {generatedCode && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-[var(--text-tertiary)]">Código gerado</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-[12px] font-medium text-[var(--accent)] hover:underline cursor-pointer focus-visible:outline-none"
                  >
                    {codeCopied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <pre
                  className={cn(
                    'p-3 rounded-lg text-[11px] font-mono overflow-x-auto',
                    'bg-[var(--bg-base)] border border-[var(--border-hairline)]',
                    'text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-all',
                  )}
                >
                  {generatedCode}
                </pre>
              </div>
            )}
          </section>

          <div style={{ height: 1, background: 'var(--border-hairline)' }} />

          {/* QR Code section */}
          <section>
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">QR Code</h3>
            <p className="text-[12px] text-[var(--text-secondary)] mb-3">
              Para compartilhamento offline e materiais impressos.
            </p>
            {qrDataUrl ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={qrDataUrl}
                  alt="QR Code do formulário"
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: 12,
                    border: '1px solid var(--border-hairline)',
                    padding: 8,
                    background: '#ffffff',
                  }}
                />
                <a
                  href={qrDataUrl}
                  download={`qr-${application?.slug || 'form'}.png`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium',
                    'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                    'text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer',
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Baixar PNG
                </a>
              </div>
            ) : (
              <div
                className="h-10 rounded-lg animate-pulse"
                style={{ background: 'var(--border-hairline)' }}
              />
            )}
          </section>
        </div>
      </div>

      {/* ── Right panel ── preview ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-4 overflow-hidden"
        style={{ background: 'var(--bg-base)' }}
      >
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Exemplo de como ficará no seu site
        </p>

        {/* Page mock */}
        <div
          className="w-full max-w-[640px] mx-8 rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-surface-1)',
            border: '1px solid var(--border-hairline)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* Fake page lines (top) */}
          <div className="p-6 space-y-2">
            {[0.7, 0.5, 0.6, 0.4].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded-full"
                style={{
                  width: `${w * 100}%`,
                  background: 'var(--border-hairline)',
                }}
              />
            ))}
          </div>

          {/* Iframe mock */}
          <div
            className="mx-6 mb-4 rounded-lg flex items-center justify-center text-[13px] font-medium"
            style={{
              height: Math.min(embedHeight, 280),
              background: 'var(--accent)',
              color: 'white',
              opacity: 0.85,
            }}
          >
            Seu formulário aqui
          </div>

          {/* Fake page lines (bottom) */}
          <div className="p-6 pt-2 space-y-2">
            {[0.6, 0.45, 0.7].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded-full"
                style={{
                  width: `${w * 100}%`,
                  background: 'var(--border-hairline)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
