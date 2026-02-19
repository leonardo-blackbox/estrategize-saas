import { useState } from 'react';
import type { Consultancy, CreateConsultancyPayload, UpdateConsultancyPayload } from '../../api/consultancies.ts';

interface ConsultancyFormProps {
  initial?: Consultancy | null;
  onSubmit: (data: CreateConsultancyPayload | UpdateConsultancyPayload) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function ConsultancyForm({ initial, onSubmit, onCancel, loading }: ConsultancyFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [clientName, setClientName] = useState(initial?.client_name ?? '');
  const [error, setError] = useState('');

  const isEdit = !!initial;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        client_name: clientName.trim() || undefined,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white">
          {isEdit ? 'Edit Consultancy' : 'New Consultancy'}
        </h2>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Digital Transformation Strategy"
              maxLength={255}
            />
          </div>

          <div>
            <label htmlFor="client_name" className="block text-sm font-medium text-slate-300">
              Client Name
            </label>
            <input
              id="client_name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. TechCorp Inc."
              maxLength={255}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
