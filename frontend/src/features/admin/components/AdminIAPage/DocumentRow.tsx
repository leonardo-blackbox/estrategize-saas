import type { KnowledgeDocument } from '../../../../types/knowledge.ts';
import { Button } from '../../../../components/ui/Button.tsx';

interface DocumentRowProps {
  document: KnowledgeDocument;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const STATUS_CONFIG = {
  processing: {
    label: 'Processando',
    className: 'bg-amber-500/10 text-amber-500',
    spin: true,
  },
  ready: {
    label: 'Pronto',
    className: 'bg-emerald-500/10 text-emerald-500',
    spin: false,
  },
  error: {
    label: 'Erro',
    className: 'bg-red-500/10 text-red-500',
    spin: false,
  },
} as const;

export function DocumentRow({ document: doc, onDelete, isDeleting }: DocumentRowProps) {
  const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.error;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)]">
      <svg className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.name}</p>
        {doc.status === 'ready' && (
          <p className="text-xs text-[var(--text-tertiary)]">{doc.chunk_count} chunks</p>
        )}
      </div>

      <span className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
        {status.spin && (
          <span className="h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" />
        )}
        {status.label}
      </span>

      <Button
        variant="ghost"
        size="xs"
        disabled={isDeleting || doc.status === 'processing'}
        loading={isDeleting}
        className="shrink-0 hover:text-red-500"
        onClick={() => onDelete(doc.id)}
      >
        Remover
      </Button>
    </div>
  );
}
