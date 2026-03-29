import type { KnowledgeDocument } from '../../services/knowledge.api.ts';

interface KnowledgeListProps {
  documents: KnowledgeDocument[];
  onDelete: (id: string) => void;
  isLoading: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUS_CONFIG = {
  processing: { label: 'Processando', className: 'bg-amber-500/10 text-amber-400' },
  ready:      { label: 'Indexado',    className: 'bg-emerald-500/10 text-emerald-400' },
  error:      { label: 'Erro',        className: 'bg-red-500/10 text-red-400' },
} as const;

export function KnowledgeList({ documents, onDelete, isLoading }: KnowledgeListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--bg-surface-1)]" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-10 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">
          Nenhum documento adicionado. Faca upload de PDFs da metodologia Iris para treinar a IA.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const status = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.error;
        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{doc.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {doc.file_type.toUpperCase()} · {formatFileSize(doc.file_size_bytes)} · {doc.chunk_count} chunks · {formatDate(doc.created_at)}
              </p>
              {doc.status === 'error' && doc.error_message && (
                <p className="mt-0.5 text-xs text-red-400">{doc.error_message}</p>
              )}
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
            <button onClick={() => onDelete(doc.id)} disabled={doc.status === 'processing'} className="shrink-0 rounded p-1 text-[var(--text-tertiary)] transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Remover documento">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
