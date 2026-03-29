import { useRef, useState } from 'react';

interface KnowledgeUploadProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function KnowledgeUpload({ onUpload, isUploading }: KnowledgeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file || isUploading) return;
    onUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      onClick={() => !isUploading && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 cursor-pointer transition-colors',
        isDragging
          ? 'border-[var(--text-secondary)] bg-[var(--bg-surface-1)]'
          : 'border-[var(--border-hairline)] hover:bg-[var(--bg-surface-1)]',
        isUploading ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        disabled={isUploading}
        onChange={handleChange}
      />
      {isUploading ? (
        <>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-hairline)] border-t-[var(--text-secondary)]" />
          <p className="text-xs text-[var(--text-secondary)]">Processando...</p>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--text-primary)]">
            Arraste um arquivo ou clique para selecionar
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">PDF, TXT ou MD. Maximo 10 MB</p>
        </>
      )}
    </div>
  );
}
