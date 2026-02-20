import { useState } from 'react';
import type { DiagnosisContent } from '../../api/diagnoses.ts';
import { Button } from '../ui/Button.tsx';
import { Textarea } from '../ui/Input.tsx';

interface DiagnosisEditorProps {
  initialContent: DiagnosisContent;
  onSave: (content: DiagnosisContent) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function DiagnosisEditor({
  initialContent,
  onSave,
  onCancel,
  loading,
}: DiagnosisEditorProps) {
  const [summary, setSummary] = useState(initialContent.executiveSummary);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!summary.trim()) {
      setError('Executive summary is required');
      return;
    }

    try {
      const updatedContent: DiagnosisContent = {
        ...initialContent,
        executiveSummary: summary.trim(),
      };
      await onSave(updatedContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save diagnosis');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
        onClick={onCancel}
      />
      <div className="relative w-full max-w-2xl rounded-[var(--radius-modal)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-elev)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Edit Diagnosis</h2>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Textarea
            label="Executive Summary"
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Update the executive summary..."
          />

          <p className="text-xs text-[var(--text-tertiary)]">
            Note: Sections and insights are read-only. Generate a new diagnosis to replace the entire content.
          </p>

          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
