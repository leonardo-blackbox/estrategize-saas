import { useKnowledge } from '../../hooks/useKnowledge.ts';
import { KnowledgeUpload } from './KnowledgeUpload.tsx';
import { KnowledgeList } from './KnowledgeList.tsx';

export function AdminIAPage() {
  const { documents, isLoading, uploadDoc, isUploading, deleteDoc } = useKnowledge();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Base de Conhecimento</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Documentos da metodologia Iris indexados para uso pela IA.
        </p>
      </div>

      <KnowledgeUpload onUpload={uploadDoc} isUploading={isUploading} />

      <KnowledgeList
        documents={documents}
        onDelete={deleteDoc}
        isLoading={isLoading}
      />
    </div>
  );
}
