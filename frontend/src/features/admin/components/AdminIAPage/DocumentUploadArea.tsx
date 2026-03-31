import { useRef, useState } from 'react';

interface DocumentUploadAreaProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

const ALLOWED = ['.pdf', '.txt', '.md'];

export function DocumentUploadArea({ onUpload, isUploading }: DocumentUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);

  function validateAndUpload(file: File) {
    const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED.includes(ext)) { setTypeError(`Tipo inválido: ${ext}. Use PDF, TXT ou MD.`); return; }
    setTypeError(null);
    onUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndUpload(f);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) validateAndUpload(f);
    if (inputRef.current) inputRef.current.value = '';
  }

  const zoneClass = [
    'flex flex-col items-center justify-center gap-2 rounded-[var(--radius-md)]',
    'border-2 border-dashed p-8 cursor-pointer transition-colors',
    isDragging ? 'border-[var(--text-secondary)] bg-[var(--bg-surface-1)]'
               : 'border-[var(--border-hairline)] hover:bg-[var(--bg-surface-1)]',
    isUploading ? 'pointer-events-none opacity-60' : '',
  ].join(' ');

  return (
    <div
      onClick={() => !isUploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={zoneClass}
    >
      <input ref={inputRef} type="file" accept=".pdf,.txt,.md" className="hidden" disabled={isUploading} onChange={handleChange} />
      {isUploading ? (
        <>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-hairline)] border-t-[var(--text-secondary)]" />
          <p className="text-xs text-[var(--text-secondary)]">Enviando...</p>
        </>
      ) : (
        <>
          <svg className="h-6 w-6 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <p className="text-sm text-[var(--text-primary)]">Arraste um arquivo PDF, TXT ou MD</p>
          <p className="text-xs text-[var(--text-tertiary)]">ou clique para selecionar</p>
        </>
      )}
      {typeError && <p className="text-xs text-red-500 mt-1">{typeError}</p>}
    </div>
  );
}
