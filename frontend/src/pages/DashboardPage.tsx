import { useAuthStore } from '../stores/authStore.ts';

export function DashboardPage() {
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Iris Platform</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.email}</span>
          <button
            onClick={() => void signOut()}
            className="rounded-md bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 65px)' }}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-slate-400">Welcome back, {user?.user_metadata?.full_name ?? user?.email}</p>
        </div>
      </main>
    </div>
  );
}
