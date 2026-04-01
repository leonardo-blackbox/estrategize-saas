import { useState } from 'react';
import { Button } from '../../../../components/ui/Button.tsx';
import type { HelenaTestResult } from '../../../../api/adminHelena.ts';

interface HelenaTesterSectionProps {
  onTest: (transcript: string) => void;
  result: HelenaTestResult | null;
  isLoading: boolean;
  error: string | null;
}

export function HelenaTesterSection({ onTest, result, isLoading, error }: HelenaTesterSectionProps) {
  const [transcript, setTranscript] = useState('');

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Testar Helena</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Cole um trecho de transcricao simulada para testar a resposta.
        </p>
      </div>

      <textarea
        rows={5}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Cole um trecho de transcricao aqui..."
        className={[
          'w-full rounded-[var(--radius-md)] border border-[var(--border-hairline)]',
          'bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)]',
          'placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-violet-500',
          'resize-none',
        ].join(' ')}
      />

      <Button
        variant="secondary"
        size="sm"
        disabled={!transcript.trim() || isLoading}
        loading={isLoading}
        onClick={() => onTest(transcript)}
      >
        Testar
      </Button>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {result && (
        <pre className="text-xs bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] rounded-[var(--radius-md)] p-4 overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
