import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.ts';
import { useProfile } from '../hooks/useProfile.ts';

/**
 * AdminRoute — protege /admin/*.
 * - Não autenticado → /login
 * - Carregando → spinner (evita flash redirect)
 * - role !== 'admin' → /formacao
 * - role === 'admin' → renderiza children / Outlet
 */
export function AdminRoute({ children }: { children?: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const { data: profile, isLoading: profileLoading, isError } = useProfile();

  // Auth ainda inicializando
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Não autenticado
  if (!user) return <Navigate to="/login" replace />;

  // Perfil carregando (query ao backend)
  if (profileLoading) {
    return <LoadingScreen />;
  }

  // Backend indisponível ou profile não encontrado → não bloquear com tela branca
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-base)] gap-3">
        <p className="text-sm text-[var(--text-secondary)]">Não foi possível verificar permissões.</p>
        <p className="text-xs text-[var(--text-tertiary)]">Verifique se o backend está rodando em localhost:3001</p>
      </div>
    );
  }

  // Autenticado mas sem role admin
  if (profile?.role !== 'admin') {
    return <Navigate to="/formacao" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--border-default)] border-t-[var(--text-secondary)] animate-spin" />
        <p className="text-xs text-[var(--text-tertiary)]">Verificando acesso...</p>
      </div>
    </div>
  );
}
