import { useState } from 'react';
import type { DiagnosisContent } from '../../api/diagnoses.ts';

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
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Edit Diagnosis</h2>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-slate-300 mb-2">
              Executive Summary
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              rows={4}
              placeholder="Update the executive summary..."
            />
          </div>

          <p className="text-xs text-slate-400">
            Note: Sections and insights are read-only. Generate a new diagnosis to replace the entire content.
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
