import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/authStore.ts';
import { useThemeStore } from '../../../../stores/themeStore.ts';
import { useProfile, useIsAdmin } from '../../../../hooks/useProfile.ts';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { cn } from '../../../../lib/cn.ts';
import { fetchBalance } from '../../../../api/credits.ts';
import { client } from '../../../../api/client.ts';
import { supabase } from '../../../../lib/supabase.ts';
import { useSubscription, useBillingPortal } from '../../hooks/useSubscription.ts';

async function updateProfile(data: { full_name?: string; avatar_url?: string | null }) {
  return client.patch('/auth/profile', { json: data }).json();
}

const ChevronRight = () => (
  <svg className="h-4 w-4 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="h-4 w-4 text-white animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const CameraIcon = () => (
  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);

const Divider = () => <div className="h-px bg-[var(--border-hairline)] mx-4" />;

function ThemeIconButton() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Mudar para tema clássico' : 'Mudar para modo noturno'}
      className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
        'transition-all duration-200 cursor-pointer',
        isDark
          ? 'bg-[var(--accent)] text-[var(--accent-text)]'
          : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
      )}
    >
      {isDark ? (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.222 4.222a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM15.657 4.929a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-8 3a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm14 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM5.636 14.364a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm9.435.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

function InlineEditField({
  value,
  onSave,
  type = 'text',
  placeholder,
  saving,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  type?: 'text' | 'email';
  placeholder?: string;
  saving?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = async () => {
    if (draft.trim() === value) { setEditing(false); return; }
    await onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          onBlur={() => void commit()}
          className={cn(
            'flex-1 min-w-0 bg-transparent text-sm font-medium text-[var(--text-primary)]',
            'border-b border-[var(--accent)] outline-none pb-0.5',
            'placeholder:text-[var(--text-tertiary)]',
          )}
          placeholder={placeholder}
        />
        {saving && <SpinnerIcon />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(value); setEditing(true); }}
      className="flex-1 min-w-0 text-left text-sm font-medium text-[var(--text-primary)] truncate hover:text-[var(--accent)] transition-colors duration-150 cursor-pointer"
    >
      {value || <span className="text-[var(--text-tertiary)]">{placeholder}</span>}
    </button>
  );
}

export function ContaPage() {
  const { user, signOut } = useAuthStore();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailNote, setEmailNote] = useState<string | null>(null);

  const { data: balanceData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: fetchBalance,
    staleTime: 60_000,
  });

  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const { mutate: openPortal, isPending: isPortalLoading } = useBillingPortal();

  const creditValue = balanceData?.data?.available != null
    ? `${balanceData.data.available} créditos`
    : '—';

  const avatarMutation = useMutation({
    mutationFn: (avatar_url: string | null) => updateProfile({ avatar_url }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadError(null);
    if (!file.type.startsWith('image/')) { setUploadError('Apenas imagens são permitidas.'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Imagem deve ter no máximo 5 MB.'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: storageError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (storageError) throw new Error(storageError.message);
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      await avatarMutation.mutateAsync(`${urlData.publicUrl}?t=${Date.now()}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao fazer upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveName = async (full_name: string) => {
    setNameSaving(true);
    try { await updateProfile({ full_name }); void queryClient.invalidateQueries({ queryKey: ['profile'] }); }
    finally { setNameSaving(false); }
  };

  const handleSaveEmail = async (email: string) => {
    setEmailSaving(true);
    setEmailNote(null);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setEmailNote('Confirmação enviada para o novo endereço.');
    } catch (err) {
      setEmailNote(err instanceof Error ? err.message : 'Erro ao atualizar e-mail.');
    } finally {
      setEmailSaving(false);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || '';
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = (displayName || user?.email || 'U').charAt(0).toUpperCase();

  const cardClass = cn(
    'rounded-2xl overflow-hidden',
    'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
    'transition-colors duration-[var(--duration-normal)]',
  );

  const rowClass = 'flex items-center justify-between gap-4 px-4 py-3.5';

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-2xl mx-auto space-y-4"
    >
      <motion.div variants={staggerItem}>
        <h1
          className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-none"
          style={{
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Conta
        </h1>
      </motion.div>

      {/* ── Bloco principal unificado ── */}
      <motion.div variants={staggerItem} className={cardClass}>

        {/* Avatar + nome + email */}
        <div className="px-4 py-5 flex items-center gap-4">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Alterar foto de perfil"
              className="relative h-[72px] w-[72px] rounded-full overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            >
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName || 'Avatar'} className="h-full w-full object-cover" />
                : (
                  <div className="h-full w-full bg-[var(--bg-surface-2)] flex items-center justify-center">
                    <span className="text-2xl font-semibold text-[var(--text-primary)]">{initials}</span>
                  </div>
                )
              }
              <div className={cn(
                'absolute inset-0 bg-black/45 flex items-center justify-center',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                uploading && 'opacity-100',
              )}>
                {uploading ? <SpinnerIcon /> : <CameraIcon />}
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleFileChange} />
          </div>

          {/* Nome + email */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <InlineEditField
                value={displayName}
                onSave={handleSaveName}
                placeholder="Seu nome"
                saving={nameSaving}
              />
              {isAdmin && (
                <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/20">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <path d="M6 1L7.55 4.27L11.1 4.78L8.55 7.27L9.09 10.82L6 9.19L2.91 10.82L3.45 7.27L0.9 4.78L4.45 4.27L6 1Z" />
                  </svg>
                  Admin
                </span>
              )}
            </div>
            <InlineEditField
              value={user?.email ?? ''}
              onSave={handleSaveEmail}
              type="email"
              placeholder="seu@email.com"
              saving={emailSaving}
            />
            {emailNote && (
              <p className={cn('text-[11px]', emailNote.includes('Confirmação') ? 'text-[var(--accent)]' : 'text-red-500')}>
                {emailNote}
              </p>
            )}
            {uploadError && <p className="text-[11px] text-red-500">{uploadError}</p>}
          </div>
        </div>

        <Divider />

        {/* Aparência */}
        <div className={rowClass}>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Aparência</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Clássico ou Modo Noturno</p>
          </div>
          <ThemeIconButton />
        </div>

        <Divider />

        {/* Créditos */}
        <Link to="/creditos" className={cn(rowClass, 'hover:bg-[var(--bg-hover)] transition-colors duration-150')}>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Créditos</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Histórico e uso</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{creditValue}</span>
            <ChevronRight />
          </div>
        </Link>

        <Divider />

        {/* Assinatura */}
        {isSubscriptionLoading ? (
          <div className={cn(rowClass, 'animate-pulse')}>
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-[var(--bg-surface-2)]" />
              <div className="h-3 w-20 rounded bg-[var(--bg-surface-2)]" />
            </div>
          </div>
        ) : subscription ? (
          <button
            type="button"
            onClick={() => openPortal()}
            disabled={isPortalLoading}
            className={cn(rowClass, 'w-full text-left hover:bg-[var(--bg-hover)] transition-colors duration-150 disabled:opacity-60')}
          >
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{subscription.plan_name}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Gerenciar assinatura</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isPortalLoading && <SpinnerIcon />}
              <ChevronRight />
            </div>
          </button>
        ) : (
          <Link to="/planos" className={cn(rowClass, 'hover:bg-[var(--bg-hover)] transition-colors duration-150')}>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Assinatura</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Nenhum plano ativo</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-medium text-[var(--accent)]">Ver planos</span>
              <ChevronRight />
            </div>
          </Link>
        )}
      </motion.div>

      {/* ── Administração (separado, só para admin) ── */}
      <AnimatePresence>
        {isAdmin && (
          <motion.div
            key="admin-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative overflow-hidden rounded-2xl',
              'bg-[var(--bg-surface-1)] border border-[var(--accent)]/20',
            )}
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.06, filter: 'blur(48px)' }} aria-hidden="true" />
            <div className="relative p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-[var(--accent-subtle)] border border-[var(--accent)]/15">
                  <svg className="h-[18px] w-[18px] text-[var(--accent)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Painel Administrativo</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                      <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1L7.55 4.27L11.1 4.78L8.55 7.27L9.09 10.82L6 9.19L2.91 10.82L3.45 7.27L0.9 4.78L4.45 4.27L6 1Z" /></svg>
                      Nível Admin
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Acesso completo a cursos, usuários e configurações.</p>
                </div>
              </div>
              <Link
                to="/admin"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] bg-[var(--accent)] text-[var(--accent-text)] text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all duration-150"
              >
                Acessar Painel Admin
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Encerrar Sessão ── */}
      <motion.div variants={staggerItem}>
        <button
          onClick={() => void signOut()}
          className={cn(
            'w-full flex items-center justify-center py-3.5 rounded-2xl',
            'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
            'text-red-500 text-sm font-medium',
            'hover:bg-red-500/5 transition-all duration-200 cursor-pointer',
          )}
        >
          Encerrar Sessão
        </button>
      </motion.div>
    </motion.div>
  );
}
