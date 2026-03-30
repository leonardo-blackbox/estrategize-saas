import { useRef } from 'react';
import { useConsultancyDocuments } from '../../hooks/useConsultancyDocuments.ts';
import type { KnowledgeDocument } from '../../services/consultancyDocuments.api.ts';

interface ConsultoriaDocumentosProps { consultancyId: string; }

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  processing: { label: 'Processando', className: 'bg-amber-500/10 text-amber-500' },
  ready:      { label: 'Pronto',      className: 'bg-emerald-500/10 text-emerald-500' },
  error:      { label: 'Erro',        className: 'bg-red-500/10 text-red-500' },
};

function fmt(iso: string) { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
function fmtSize(b: number) { return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`; }

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

export function ConsultoriaDocumentos({ consultancyId }: ConsultoriaDocumentosProps) {
  const { documents, isLoading, uploadDoc, isUploading, deleteDoc } = useConsultancyDocuments(consultancyId);
  const inputRef = useRef<HTMLInputElement>(null);
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { uploadDoc(file); e.target.value = ''; }
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Documentos do Cliente</h2>
        <button onClick={() => inputRef.current?.click()} disabled={isUploading}
          className="rounded-lg bg-[var(--color-primary,#7c5cfc)] px-4 py-2 text-xs font-medium text-white transition-opacity disabled:opacity-50">
          {isUploading ? 'Enviando...' : 'Enviar arquivo'}
        </button>
        <input ref={inputRef} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={handleFileChange} />
      </div>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--bg-surface-1)]" />)}</div>
      ) : documents.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-10 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">Nenhum documento enviado. Envie PDFs do cliente para enriquecer o contexto da IA.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc: KnowledgeDocument) => {
            const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.error;
            return (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{doc.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{doc.file_type.toUpperCase()} · {fmtSize(doc.file_size_bytes)} · {fmt(doc.created_at)}</p>
                  {doc.status === 'error' && doc.error_message && <p className="mt-0.5 text-xs text-red-400">{doc.error_message}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
                <button onClick={() => deleteDoc(doc.id)} disabled={doc.status === 'processing'}
                  className="shrink-0 rounded p-1 text-[var(--text-tertiary)] transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remover documento"><TrashIcon /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
