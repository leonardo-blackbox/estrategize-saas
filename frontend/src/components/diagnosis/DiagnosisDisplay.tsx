import type { Diagnosis } from '../../api/diagnoses.ts';
import { Button } from '../ui/Button.tsx';

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
      <div className="border-b border-[var(--border-hairline)] pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-[var(--text-secondary)]">
              Diagnosis v{diagnosis.version}
              {isEdited && diagnosis.edited_at && (
                <span className="ml-2 text-[var(--color-warning)]">
                  (Edited{' '}
                  {new Date(diagnosis.edited_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit',
                  })})
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Generated{' '}
              {new Date(diagnosis.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {diagnosis.tokens_used && ` * ${diagnosis.tokens_used} tokens`}
            </p>
          </div>
          <div className="flex gap-2">
            {onViewHistory && (
              <Button variant="ghost" size="sm" onClick={onViewHistory}>
                History
              </Button>
            )}
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Executive Summary</h3>
        <p className="text-[var(--text-secondary)] leading-relaxed">{diagnosis.content.executiveSummary}</p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {diagnosis.content.sections.map((section, idx) => (
          <div key={idx}>
            <h4 className="text-base font-semibold text-[var(--text-primary)] mb-3">{section.name}</h4>
            <ul className="space-y-2">
              {section.insights.map((insight, insightIdx) => (
                <li
                  key={insightIdx}
                  className="flex gap-3 text-[var(--text-secondary)] leading-relaxed"
                >
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--text-primary)]" />
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
