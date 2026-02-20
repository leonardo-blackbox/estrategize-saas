import { useState } from 'react';
import type { Consultancy, CreateConsultancyPayload, UpdateConsultancyPayload } from '../../api/consultancies.ts';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';

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
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-[var(--radius-modal)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-elev)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {isEdit ? 'Edit Consultancy' : 'New Consultancy'}
        </h2>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <Input
            label="Title *"
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Digital Transformation Strategy"
            maxLength={255}
          />

          <Input
            label="Client Name"
            id="client_name"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. TechCorp Inc."
            maxLength={255}
          />

          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
