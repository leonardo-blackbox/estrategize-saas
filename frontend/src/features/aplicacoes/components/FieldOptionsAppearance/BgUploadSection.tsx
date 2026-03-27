import { cn } from '../../../../lib/cn.ts';
import { UploadIcon } from './UploadIcon.tsx';

interface BgUploadSectionProps {
  bgUrl?: string;
  overlayOpacity?: number;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onOverlayChange: (v: number) => void;
}

export function BgUploadSection({
  bgUrl, overlayOpacity, uploading, onUpload, onRemove, onOverlayChange,
}: BgUploadSectionProps) {
  return (
    <div>
      <label className="text-[12px] font-medium text-[var(--text-secondary)] block mb-2">Imagem de fundo</label>
      {bgUrl ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-12 h-8 rounded object-cover"
              style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', border: '1px solid var(--border-hairline)' }}
            />
            <button onClick={onRemove} className="text-[12px] text-[var(--text-tertiary)] hover:text-[#ff453a] transition-colors cursor-pointer">
              Remover
            </button>
          </div>
          <div>
            <label className="text-[12px] text-[var(--text-secondary)] block mb-1">
              Opacidade do overlay: {overlayOpacity ?? 50}%
            </label>
            <input
              type="range" min={0} max={80}
              value={overlayOpacity ?? 50}
              onChange={(e) => onOverlayChange(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>
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
          {uploading ? 'Enviando...' : 'Upload fundo (JPG, PNG, WebP -- max 5MB)'}
          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="sr-only" onChange={onUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
}
