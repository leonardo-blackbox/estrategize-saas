import { useAuthStore } from '../stores/authStore.ts';

export function AuthErrorMessage() {
  const { error, clearError } = useAuthStore();

  if (!error) return null;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-3 text-sm text-[var(--color-error)]">
      <div className="flex justify-between items-start">
        <span>{error}</span>
        <button
          onClick={clearError}
          className="ml-2 text-[var(--color-error)] hover:opacity-70 transition-opacity"
          type="button"
        >
          x
        </button>
      </div>
    </div>
  );
}
