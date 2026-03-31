import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import {
  adminListDocuments,
  adminUploadDocument,
  adminDeleteDocument,
  adminTestQuery,
} from '../../../../api/knowledge.ts';
import type { KnowledgeTestResult } from '../../../../types/knowledge.ts';
import { DocumentUploadArea } from './DocumentUploadArea.tsx';
import { DocumentList } from './DocumentList.tsx';
import { TestQueryPanel } from './TestQueryPanel.tsx';

export function AdminIAPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<KnowledgeTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const {
    data: documents = [],
    isLoading,
    error: listError,
  } = useQuery({
    queryKey: ['admin-knowledge-documents'],
    queryFn: adminListDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: adminUploadDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-knowledge-documents'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteDocument,
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-documents'] });
    },
  });

  const testMutation = useMutation({
    mutationFn: adminTestQuery,
    onSuccess: (data) => { setTestResult(data); setTestError(null); },
    onError: (err) => { setTestError((err as Error).message); setTestResult(null); },
  });

  function handleUpload(file: File) {
    uploadMutation.mutate(file);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    deleteMutation.mutate(id);
  }

  function handleTestQuery(query: string) {
    testMutation.mutate(query);
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">IA Global</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Gerencie a base de conhecimento da metodologia Iris.
        </p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <DocumentUploadArea
          onUpload={handleUpload}
          isUploading={uploadMutation.isPending}
        />
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">Documentos</p>
          {documents.length > 0 && (
            <span className="rounded-full px-2 py-0.5 text-xs bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-[var(--text-tertiary)]">
              {documents.length}
            </span>
          )}
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
          ))
        ) : listError ? (
          <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-1">
            <p className="text-sm text-red-500 font-medium">Erro ao carregar documentos</p>
            <p className="text-xs text-[var(--text-tertiary)] font-mono break-all">
              {(listError as Error).message}
            </p>
          </div>
        ) : (
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </motion.div>

      <motion.div variants={staggerItem} className="border-t border-[var(--border-hairline)] pt-6">
        <TestQueryPanel
          onSubmit={handleTestQuery}
          result={testResult}
          isLoading={testMutation.isPending}
          error={testError}
        />
      </motion.div>
    </motion.div>
  );
}
