import { useAuthStore } from '../stores/authStore.ts';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 text-slate-400">
        Welcome back, {user?.user_metadata?.full_name ?? user?.email}
      </p>
    </div>
  );
}
