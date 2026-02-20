import { useState } from 'react';
import type { Diagnosis, DiagnosisContent } from '../../api/diagnoses.ts';
import { DiagnosisDisplay } from './DiagnosisDisplay.tsx';
import { DiagnosisEditor } from './DiagnosisEditor.tsx';

type View = 'display' | 'edit' | 'history';

interface DiagnosisModalProps {
  diagnosis: Diagnosis;
  onClose: () => void;
  onSave: (content: DiagnosisContent) => Promise<void>;
  onLoadHistory?: () => Promise<Diagnosis[]>;
  saving: boolean;
}

export function DiagnosisModal({
  diagnosis,
  onClose,
  onSave,
  onLoadHistory,
  saving,
}: DiagnosisModalProps) {
  const [view, setView] = useState<View>('display');
  const [history, setHistory] = useState<Diagnosis[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleViewHistory = async () => {
    if (!onLoadHistory) return;
    setHistoryLoading(true);
    try {
      const data = await onLoadHistory();
      setHistory(data);
      setView('history');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-xl border border-slate-700 bg-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Strategic Diagnosis</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'display' && (
            <DiagnosisDisplay
              diagnosis={diagnosis}
              onEdit={() => setView('edit')}
              onViewHistory={onLoadHistory ? handleViewHistory : undefined}
            />
          )}

          {view === 'edit' && (
            <DiagnosisEditor
              initialContent={diagnosis.content}
              onSave={async (content) => {
                await onSave(content);
                setView('display');
              }}
              onCancel={() => setView('display')}
              loading={saving}
            />
          )}

          {view === 'history' && (
            <div className="space-y-4">
              <button
                onClick={() => setView('display')}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                ← Back to current
              </button>

              {historyLoading ? (
                <p className="text-slate-400">Loading history...</p>
              ) : history && history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-lg border border-slate-700 bg-slate-700/40 hover:bg-slate-700/60 transition-colors cursor-pointer"
                      onClick={() => {
                        // Show this version in display
                        setView('display');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">v{v.version}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(v.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {v.is_edited && ' • Edited'}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {v.tokens_used ? `${v.tokens_used} tokens` : 'Manual'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No version history</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
