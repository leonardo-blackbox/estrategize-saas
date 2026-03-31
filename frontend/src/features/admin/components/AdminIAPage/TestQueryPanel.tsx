import { useState } from 'react';
import type { KnowledgeTestResult } from '../../../../types/knowledge.ts';
import { Button } from '../../../../components/ui/Button.tsx';

interface TestQueryPanelProps {
  onSubmit: (query: string) => void;
  result: KnowledgeTestResult | null;
  isLoading: boolean;
  error: string | null;
}

export function TestQueryPanel({ onSubmit, result, isLoading, error }: TestQueryPanelProps) {
  const [query, setQuery] = useState('');

  function handleSubmit() {
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim());
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Testar IA</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Envie uma pergunta para verificar se a IA responde com base nos documentos.
        </p>
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={3}
        placeholder="Ex: Qual a primeira etapa do metodo Iris?"
        className={[
          'w-full resize-none rounded-[var(--radius-md)] border border-[var(--border-hairline)]',
          'bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)]',
          'placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-default)]',
          'transition-colors',
        ].join(' ')}
      />

      <Button
        variant="secondary"
        size="sm"
        disabled={!query.trim() || isLoading}
        loading={isLoading}
        onClick={handleSubmit}
      >
        {isLoading ? 'Consultando...' : 'Enviar pergunta'}
      </Button>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {result && (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4 space-y-3">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">{result.answer}</p>
          {result.sources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Fontes:</p>
              <ul className="space-y-0.5">
                {result.sources.map((src, i) => (
                  <li key={i} className="text-xs text-[var(--text-tertiary)] before:content-['•'] before:mr-1.5">
                    {src}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
