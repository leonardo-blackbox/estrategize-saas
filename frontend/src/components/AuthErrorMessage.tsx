import { useAuthStore } from '../stores/authStore.ts';

export function AuthErrorMessage() {
  const { error, clearError } = useAuthStore();

  if (!error) return null;

  return (
    <div className="rounded-md bg-red-900/50 border border-red-700 p-3 text-sm text-red-200">
      <div className="flex justify-between items-start">
        <span>{error}</span>
        <button
          onClick={clearError}
          className="ml-2 text-red-400 hover:text-red-200"
          type="button"
        >
          x
        </button>
      </div>
    </div>
  );
}
