import type { KnowledgeDocument } from '../../../../api/adminHelena.ts';
import { DocumentUploadArea } from '../AdminIAPage/DocumentUploadArea.tsx';
import { DocumentRow } from '../AdminIAPage/DocumentRow.tsx';

interface HelenaKnowledgeSectionProps {
  documents: KnowledgeDocument[];
  isLoading: boolean;
  listError: Error | null;
  onUpload: (file: File) => void;
  isUploading: boolean;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function HelenaKnowledgeSection({
  documents,
  isLoading,
  listError,
  onUpload,
  isUploading,
  onDelete,
  deletingId,
}: HelenaKnowledgeSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Base de Conhecimento</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Documentos que a Helena usa durante reunioes.
        </p>
      </div>

      <DocumentUploadArea onUpload={onUpload} isUploading={isUploading} />

      <div className="space-y-1">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
          ))
        ) : listError ? (
          <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-1">
            <p className="text-sm text-red-500 font-medium">Erro ao carregar documentos</p>
            <p className="text-xs text-[var(--text-tertiary)] font-mono break-all">{listError.message}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-8 text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhum documento adicionado ainda.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onDelete={onDelete}
              isDeleting={deletingId === doc.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
