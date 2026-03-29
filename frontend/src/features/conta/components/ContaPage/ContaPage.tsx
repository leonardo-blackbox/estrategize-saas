import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/authStore.ts';
import { useThemeStore } from '../../../../stores/themeStore.ts';
import { useProfile, useIsAdmin } from '../../../../hooks/useProfile.ts';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { ThemeToggle } from '../../../../components/ui/ThemeToggle.tsx';
import { cn } from '../../../../lib/cn.ts';
import { fetchBalance } from '../../../../api/credits.ts';
import { client } from '../../../../api/client.ts';
import { supabase } from '../../../../lib/supabase.ts';
import { ProfileCard } from '../ProfileCard/index.ts';
import { SubscriptionCard } from '../SubscriptionCard/index.ts';
import { useSubscription, useBillingPortal } from '../../hooks/useSubscription.ts';

async function updateProfile(data: { full_name?: string; avatar_url?: string | null }) {
  return client.patch('/auth/profile', { json: data }).json();
}

export function ContaPage() {
  const { user, signOut } = useAuthStore();
  const { theme } = useThemeStore();
  const isAdmin = useIsAdmin();
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

  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const { mutate: openPortal, isPending: isPortalLoading } = useBillingPortal();

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
    if (!file.type.startsWith('image/')) { setUploadError('Apenas imagens são permitidas.'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Imagem deve ter no máximo 5 MB.'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: storageError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
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
    try { await avatarMutation.mutateAsync(null); }
    finally { setUploading(false); }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email;
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = (displayName ?? 'U').charAt(0).toUpperCase();

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={staggerItem}>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Conta</h1>
      </motion.div>

      <motion.div variants={staggerItem}>
        <ProfileCard
          displayName={displayName}
          email={user?.email}
          avatarUrl={avatarUrl}
          initials={initials}
          isAdmin={isAdmin}
          uploading={uploading}
          uploadError={uploadError}
          onFileChange={handleFileChange}
          onRemoveAvatar={handleRemoveAvatar}
          fileInputRef={fileInputRef}
        />
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Aparência</h2>
        <div className={cn('flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4', 'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]', 'transition-colors duration-[var(--duration-normal)]')}>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">{theme === 'dark' ? 'Modo Noturno' : 'Modo Diurno'}</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Alterne entre tema claro e escuro.</p>
          </div>
          <ThemeToggle />
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Geral</h2>
        <Link to="/creditos" className={cn('flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4', 'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]', 'hover:border-[var(--border-default)] transition-all duration-200')}>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Créditos</h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Gerencie seus créditos e veja o histórico de uso.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{creditValue}</span>
            <svg className="h-4 w-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </div>
        </Link>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Assinatura</h2>
        <SubscriptionCard
          subscription={subscription}
          isLoading={isSubscriptionLoading}
          onManage={() => openPortal()}
          isManaging={isPortalLoading}
        />
      </motion.div>

      <AnimatePresence>
        {isAdmin && (
          <motion.div key="admin-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="space-y-2">
            <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">Administração</h2>
            <div className={cn('relative overflow-hidden rounded-[var(--radius-md)]', 'bg-[var(--bg-surface-1)]', 'border border-[var(--accent)]/20', 'transition-all duration-300')}>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.07, filter: 'blur(40px)' }} aria-hidden="true" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.04, filter: 'blur(28px)' }} aria-hidden="true" />
              <div className="relative p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-xl shrink-0 flex items-center justify-center', 'bg-[var(--accent-subtle)] border border-[var(--accent)]/15')}>
                    <svg className="h-4.5 w-4.5 text-[var(--accent)]" style={{ width: '1.125rem', height: '1.125rem' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Painel Administrativo</h3>
                      <span className={cn('inline-flex items-center gap-1', 'text-[10px] font-bold tracking-[0.07em] uppercase', 'px-2 py-0.5 rounded-full', 'bg-[var(--accent-subtle)] text-[var(--accent)]')}>
                        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 1L7.55 4.27L11.1 4.78L8.55 7.27L9.09 10.82L6 9.19L2.91 10.82L3.45 7.27L0.9 4.78L4.45 4.27L6 1Z"/></svg>
                        Nível Admin
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed">Acesso completo a cursos, usuários, webhooks e configurações do sistema.</p>
                  </div>
                </div>
                <Link to="/admin" className={cn('flex items-center justify-center gap-2 w-full', 'py-2.5 px-4 rounded-[calc(var(--radius-md)-2px)]', 'bg-[var(--accent)] text-[var(--accent-text)]', 'text-sm font-semibold', 'hover:opacity-90 active:scale-[0.98]', 'transition-all duration-150', 'shadow-[0_1px_8px_var(--accent-subtle)]')}>
                  Acessar Painel Admin
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={staggerItem} className="pt-4">
        <button onClick={() => void signOut()} className={cn('w-full flex items-center justify-center p-4 rounded-[var(--radius-md)]', 'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]', 'text-red-500 font-medium hover:bg-red-500/5 transition-all duration-200')}>
          Encerrar Sessão
        </button>
      </motion.div>
    </motion.div>
  );
}
