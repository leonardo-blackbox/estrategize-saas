import { useAuthStore } from '../../stores/authStore.ts';
import { CreditsPill } from '../compound/CreditsPill.tsx';
import { cn } from '../../lib/cn.ts';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, signOut } = useAuthStore();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between gap-4 px-4 sm:px-6',
        'glass',
        className,
      )}
    >
      {/* Left: Brand (visible on mobile where sidebar is hidden) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--text-primary)] flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--bg-base)]">E</span>
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)] tracking-[-0.015em]">
            Estrategize
          </span>
        </div>
      </div>

      {/* Right: Credits + User */}
      <div className="flex items-center gap-3">
        <CreditsPill balance={42} />

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-[var(--text-tertiary)] truncate max-w-[160px]">
            {user?.email}
          </span>
          <button
            onClick={() => void signOut()}
            className={cn(
              'rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium',
              'text-[var(--text-secondary)]',
              'ring-1 ring-inset ring-[var(--border-hairline)]',
              'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
              'active:scale-[0.95] transition-all duration-200',
              'cursor-pointer',
            )}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
