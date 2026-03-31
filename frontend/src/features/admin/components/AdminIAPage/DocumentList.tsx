import type { KnowledgeDocument } from '../../../../types/knowledge.ts';
import { DocumentRow } from './DocumentRow.tsx';

interface DocumentListProps {
  documents: KnowledgeDocument[];
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function DocumentList({ documents, onDelete, deletingId }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-10 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">Nenhum documento adicionado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {documents.map((doc) => (
        <DocumentRow
          key={doc.id}
          document={doc}
          onDelete={onDelete}
          isDeleting={deletingId === doc.id}
        />
      ))}
    </div>
  );
}
