import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { cn } from '../../../../lib/cn.ts';

interface QrCodeSectionProps {
  publicUrl: string;
  slug: string;
}

export function QrCodeSection({ publicUrl, slug }: QrCodeSectionProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(publicUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#7c5cfc', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {});
  }, [publicUrl]);

  return (
    <section>
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">QR Code</h3>
      <p className="text-[12px] text-[var(--text-secondary)] mb-3">
        Para compartilhamento offline e materiais impressos.
      </p>
      {qrDataUrl ? (
        <div className="flex flex-col items-center gap-3">
          <img
            src={qrDataUrl}
            alt="QR Code do formulario"
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
            download={`qr-${slug || 'form'}.png`}
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
  );
}
