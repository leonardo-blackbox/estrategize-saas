import { useRef, useState } from 'react';
import { cn } from '../../lib/cn.ts';
import { adminUploadCourseCover } from '../../api/courses.ts';
import { Input } from '../ui/Input.tsx';

interface CourseCoverUploadProps {
  courseId: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}

const ACCEPTED = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

export function CourseCoverUpload({ courseId, currentUrl, onUploaded }: CourseCoverUploadProps) {
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
      const { cover_url } = await adminUploadCourseCover(courseId, file);
      onUploaded(cover_url);
      setUrlValue(cover_url);
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
      <label className="block text-xs font-medium text-[var(--text-secondary)]">Capa do curso</label>

      {/* Upload zone */}
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
        style={{ height: 120 }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Capa atual"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1.5">
            <svg className="h-6 w-6 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <span className="text-xs text-[var(--text-tertiary)]">Clique para selecionar imagem</span>
            <span className="text-[10px] text-[var(--text-muted)]">JPEG, PNG, WebP · máx 5 MB</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
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

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* URL fallback toggle */}
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
