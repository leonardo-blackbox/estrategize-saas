import type { Consultancy } from '../../api/consultancies.ts';

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
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white">Delete Consultancy</h2>
        <p className="mt-2 text-sm text-slate-400">
          Are you sure you want to delete{' '}
          <span className="font-medium text-white">{consultancy.title}</span>?
          This action can be undone by an administrator.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
