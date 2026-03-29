import { cn } from '../../../../lib/cn.ts';

interface ProfileCardProps {
  displayName: string | undefined;
  email: string | undefined;
  avatarUrl: string | null;
  initials: string;
  isAdmin: boolean;
  uploading: boolean;
  uploadError: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const SpinnerIcon = () => <svg className="h-5 w-5 text-white animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;
const CameraIcon = () => <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>;

export function ProfileCard({ displayName, email, avatarUrl, initials, isAdmin, uploading, uploadError, onFileChange, onRemoveAvatar, fileInputRef }: ProfileCardProps) {
  const triggerUpload = () => fileInputRef.current?.click();
  return (
    <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] transition-colors duration-[var(--duration-normal)]">
      <div className="flex items-center gap-4">
        <div className="relative group shrink-0">
          <button type="button" onClick={triggerUpload} disabled={uploading} className="relative h-16 w-16 rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed" aria-label="Alterar foto de perfil">
            {avatarUrl ? <img src={avatarUrl} alt={displayName ?? 'Avatar'} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[var(--bg-surface-2)] flex items-center justify-center"><span className="text-xl font-semibold text-[var(--text-primary)]">{initials}</span></div>}
            <div className={cn('absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150', uploading && 'opacity-100')}>{uploading ? <SpinnerIcon /> : <CameraIcon />}</div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={onFileChange} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{displayName}</p>
            {isAdmin && (
              <span className={cn('inline-flex items-center gap-1 shrink-0 text-[10px] font-bold tracking-[0.07em] uppercase px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/20')}>
                <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 1L7.55 4.27L11.1 4.78L8.55 7.27L9.09 10.82L6 9.19L2.91 10.82L3.45 7.27L0.9 4.78L4.45 4.27L6 1Z"/></svg>
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-tertiary)] truncate">{email}</p>
          <div className="flex items-center gap-2 mt-2">
            <button type="button" onClick={triggerUpload} disabled={uploading} className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed')}>{avatarUrl ? 'Trocar foto' : 'Adicionar foto'}</button>
            {avatarUrl && <button type="button" onClick={onRemoveAvatar} disabled={uploading} className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed')}>Remover</button>}
          </div>
          {uploadError && <p className="text-[11px] text-red-500 mt-1.5">{uploadError}</p>}
        </div>
      </div>
    </div>
  );
}
