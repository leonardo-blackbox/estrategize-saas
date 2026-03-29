import { cn } from '../../../../lib/cn.ts';

interface UserRowProps {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    subscription: { plans?: { name: string }; status: string } | null;
  };
  onClick: () => void;
}

export function UserRow({ user, onClick }: UserRowProps) {
  const initial = (user.full_name ?? user.email ?? '?')[0].toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border text-left transition-colors',
        'bg-[var(--bg-surface-1)] border-[var(--border-hairline)] hover:border-[var(--border-default)]',
      )}
    >
      <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {user.full_name ?? user.email ?? '—'}
        </p>
        {user.full_name && (
          <p className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {user.subscription?.plans?.name ? (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">
            {user.subscription.plans.name}
          </span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)]">
            Sem plano
          </span>
        )}
        {user.role === 'admin' && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--text-primary)] text-[var(--bg-base)]">
            Admin
          </span>
        )}
        <svg className="h-4 w-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </button>
  );
}
