import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore.ts';
import { useThemeStore } from '../../stores/themeStore.ts';
import { useProfile } from '../../hooks/useProfile.ts';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { ThemeToggle } from '../../components/ui/ThemeToggle.tsx';
import { cn } from '../../lib/cn.ts';
import { fetchBalance } from '../../api/credits.ts';
import { client } from '../../api/client.ts';
import { supabase } from '../../lib/supabase.ts';

async function updateProfile(data: { full_name?: string; avatar_url?: string | null }) {
  return client.patch('/auth/profile', { json: data }).json();
}

export function ContaPage() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: balanceData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: fetchBalance,
    staleTime: 60_000,
  });

  const creditValue = balanceData?.data?.available != null
    ? `${balanceData.data.available} créditos`
    : '—';

  const avatarMutation = useMutation({
    mutationFn: (avatar_url: string | null) => updateProfile({ avatar_url }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Apenas imagens são permitidas.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Imagem deve ter no máximo 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const { error: storageError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (storageError) throw new Error(storageError.message);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await avatarMutation.mutateAsync(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao fazer upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploadError(null);
    setUploading(true);
    try {
      await avatarMutation.mutateAsync(null);
    } finally {
      setUploading(false);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email;
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = (displayName ?? 'U').charAt(0).toUpperCase();

  const sections = [
    {
      title: 'Créditos',
      description: 'Gerencie seus créditos e veja o histórico de uso.',
      to: '/creditos',
      value: creditValue,
    },
    {
      title: 'Plano Atual',
      description: 'Veja e gerencie sua assinatura.',
      to: '#',
      value: 'Plano Pro',
    },
    {
      title: 'Entitlements',
      description: 'Veja seus acessos a cursos e ferramentas.',
      to: '#',
      value: '3 cursos, 4 ferramentas',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Conta</h1>
      </motion.div>

      {/* User info + avatar upload */}
      <motion.div
        variants={staggerItem}
        className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] transition-colors duration-[var(--duration-normal)]"
      >
        <div className="flex items-center gap-4">
          {/* Avatar clickable */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative h-16 w-16 rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Alterar foto de perfil"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName ?? 'Avatar'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[var(--bg-surface-2)] flex items-center justify-center">
                  <span className="text-xl font-semibold text-[var(--text-primary)]">
                    {initials}
                  </span>
                </div>
              )}

              {/* Hover / loading overlay */}
              <div
                className={cn(
                  'absolute inset-0 bg-black/40 flex items-center justify-center',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                  uploading && 'opacity-100',
                )}
              >
                {uploading ? (
                  <svg className="h-5 w-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                )}
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>

          {/* Name + email + action buttons */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {displayName}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.email}</p>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  'text-[11px] font-medium px-2.5 py-1 rounded-full',
                  'bg-[var(--accent)] text-[var(--accent-text)]',
                  'hover:opacity-90 transition-opacity cursor-pointer',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className={cn(
                    'text-[11px] font-medium px-2.5 py-1 rounded-full',
                    'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
                    'hover:bg-[var(--bg-hover)] transition-all cursor-pointer',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  Remover
                </button>
              )}
            </div>

            {uploadError && (
              <p className="text-[11px] text-red-500 mt-1.5">{uploadError}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Appearance / Theme section */}
      <motion.div variants={staggerItem} className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">
          Aparência
        </h2>
        <div
          className={cn(
            'flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4',
            'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
            'transition-colors duration-[var(--duration-normal)]',
          )}
        >
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              {theme === 'dark' ? 'Modo Noturno' : 'Modo Diurno'}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Alterne entre tema claro e escuro.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Quick links */}
      <motion.div variants={staggerItem} className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">
          Geral
        </h2>
        {sections.map((section) => (
          <Link
            key={section.title}
            to={section.to}
            className={cn(
              'flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4',
              'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
              'hover:border-[var(--border-default)] transition-all duration-200',
            )}
          >
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">{section.title}</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{section.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-[var(--text-secondary)]">{section.value}</span>
              <svg className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  );
}
