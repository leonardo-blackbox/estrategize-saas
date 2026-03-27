import { cn } from '../../../../lib/cn.ts';
import { UploadIcon } from './UploadIcon.tsx';

interface LogoUploadSectionProps {
  logoUrl?: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export function LogoUploadSection({ logoUrl, uploading, onUpload, onRemove }: LogoUploadSectionProps) {
  return (
    <div>
      <label className="text-[12px] font-medium text-[var(--text-secondary)] block mb-2">Logo</label>
      {logoUrl ? (
        <div className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-10 w-auto object-contain rounded"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-hairline)', padding: 4 }}
          />
          <button
            onClick={onRemove}
            className="text-[12px] text-[var(--text-tertiary)] hover:text-[#ff453a] transition-colors cursor-pointer"
          >
            Remover
          </button>
        </div>
      ) : (
        <label className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer',
          'border border-dashed border-[var(--border-hairline)]',
          'text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          'hover:border-[var(--accent)] transition-colors',
          uploading && 'opacity-50 pointer-events-none',
        )}>
          <UploadIcon />
          {uploading ? 'Enviando...' : 'Upload logo (PNG, SVG, WebP -- max 2MB)'}
          <input type="file" accept="image/*" className="sr-only" onChange={onUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}
