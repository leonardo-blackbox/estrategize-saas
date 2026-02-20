import type { Consultancy } from '../../api/consultancies.ts';
import { Button } from '../ui/Button.tsx';

interface DeleteConfirmDialogProps {
  consultancy: Consultancy;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function DeleteConfirmDialog({
  consultancy,
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-[var(--radius-modal)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-elev)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delete Consultancy</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Are you sure you want to delete{' '}
          <span className="font-medium text-[var(--text-primary)]">{consultancy.title}</span>?
          This action can be undone by an administrator.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void onConfirm()}
            disabled={loading}
            className="bg-[var(--color-error)] hover:opacity-90"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
