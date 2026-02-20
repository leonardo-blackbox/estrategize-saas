import type { Diagnosis } from '../../api/diagnoses.ts';

interface DiagnosisDisplayProps {
  diagnosis: Diagnosis;
  onEdit?: () => void;
  onViewHistory?: () => void;
}

export function DiagnosisDisplay({
  diagnosis,
  onEdit,
  onViewHistory,
}: DiagnosisDisplayProps) {
  const isEdited = diagnosis.is_edited && diagnosis.edited_at;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-700 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-slate-400">
              Diagnosis v{diagnosis.version}
              {isEdited && diagnosis.edited_at && (
                <span className="ml-2 text-amber-500">
                  (Edited{' '}
                  {new Date(diagnosis.edited_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit',
                  })})
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Generated{' '}
              {new Date(diagnosis.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {diagnosis.tokens_used && ` • ${diagnosis.tokens_used} tokens`}
            </p>
          </div>
          <div className="flex gap-2">
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                History
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="rounded-md px-3 py-1.5 text-sm text-indigo-400 hover:bg-indigo-500/10 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Executive Summary</h3>
        <p className="text-slate-300 leading-relaxed">{diagnosis.content.executiveSummary}</p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {diagnosis.content.sections.map((section, idx) => (
          <div key={idx}>
            <h4 className="text-base font-semibold text-white mb-3">{section.name}</h4>
            <ul className="space-y-2">
              {section.insights.map((insight, insightIdx) => (
                <li
                  key={insightIdx}
                  className="flex gap-3 text-slate-300 leading-relaxed"
                >
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
