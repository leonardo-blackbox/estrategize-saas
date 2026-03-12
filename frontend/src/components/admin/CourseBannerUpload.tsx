import { useRef, useState } from 'react';
import { cn } from '../../lib/cn.ts';
import { adminUploadCourseBanner } from '../../api/courses.ts';
import { Input } from '../ui/Input.tsx';

interface CourseBannerUploadProps {
  courseId: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

export function CourseBannerUpload({ courseId, currentUrl, onUploaded }: CourseBannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState(currentUrl);

  const preview = currentUrl || null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > MAX_BYTES) {
      setError('Arquivo muito grande. Tamanho máximo: 5 MB.');
      e.target.value = '';
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Formato inválido. Use JPEG, PNG ou WebP.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const { banner_url } = await adminUploadCourseBanner(courseId, file);
      onUploaded(banner_url);
      setUrlValue(banner_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlValue(e.target.value);
    onUploaded(e.target.value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[var(--text-secondary)]">
        Banner horizontal <span className="text-[var(--text-muted)] font-normal">(hero do curso · 16:9)</span>
      </label>

      {/* Upload zone — wider aspect for landscape */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'relative w-full rounded-[var(--radius-sm)] border border-dashed transition-colors overflow-hidden',
          'border-[var(--border-hairline)] hover:border-[var(--border-default)]',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--text-primary)]',
          uploading && 'opacity-60 cursor-not-allowed',
          !uploading && 'cursor-pointer',
        )}
        style={{ aspectRatio: '16/7', minHeight: 80 }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Banner atual"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 py-4">
            <svg className="h-6 w-6 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            <span className="text-xs text-[var(--text-tertiary)]">Clique para selecionar imagem</span>
            <span className="text-[10px] text-[var(--text-muted)]">JPEG, PNG, WebP · máx 5 MB · proporção 16:9</span>
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]/70">
            <svg className="h-6 w-6 animate-spin text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* Edit overlay when preview exists */}
        {preview && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]/0 hover:bg-[var(--bg-base)]/50 transition-colors group">
            <svg className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={handleFileChange}
      />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        type="button"
        onClick={() => setShowUrlInput((v) => !v)}
        className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        {showUrlInput ? '▲ Ocultar URL' : '▾ Ou insira uma URL'}
      </button>

      {showUrlInput && (
        <Input
          label=""
          value={urlValue}
          onChange={handleUrlChange}
          placeholder="https://..."
        />
      )}
    </div>
  );
}
