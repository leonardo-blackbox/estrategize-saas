import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import {
  helenaPluginKeys,
  fetchHelenaDocuments,
  uploadHelenaDocument,
  deleteHelenaDocument,
  fetchHelenaConfig,
  saveHelenaConfig,
  testHelena,
  fetchHelenaAnalytics,
} from '../../../../api/adminHelena.ts';
import type { HelenaTestResult } from '../../../../api/adminHelena.ts';
import { HelenaKnowledgeSection } from './HelenaKnowledgeSection.tsx';
import { HelenaWindowConfigSection } from './HelenaWindowConfigSection.tsx';
import { HelenaTesterSection } from './HelenaTesterSection.tsx';
import { HelenaAnalyticsSection } from './HelenaAnalyticsSection.tsx';

export function AdminHelenaPageContent() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<HelenaTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const { data: documents = [], isLoading: docsLoading, error: docsError } = useQuery({
    queryKey: helenaPluginKeys.documents(),
    queryFn: fetchHelenaDocuments,
  });

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: helenaPluginKeys.config(),
    queryFn: fetchHelenaConfig,
  });

  const { data: analytics = null, isLoading: analyticsLoading } = useQuery({
    queryKey: helenaPluginKeys.analytics(),
    queryFn: fetchHelenaAnalytics,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadHelenaDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: helenaPluginKeys.documents() }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHelenaDocument,
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: helenaPluginKeys.documents() });
    },
  });

  const configMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => saveHelenaConfig(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: helenaPluginKeys.config() }),
  });

  const testMutation = useMutation({
    mutationFn: testHelena,
    onSuccess: (data) => { setTestResult(data); setTestError(null); },
    onError: (err) => { setTestError((err as Error).message); setTestResult(null); },
  });

  function handleDelete(id: string) {
    setDeletingId(id);
    deleteMutation.mutate(id);
  }

  function handleToggle(key: string, value: boolean) {
    configMutation.mutate({ key, value });
  }

  function handleIntervalChange(minutes: number) {
    configMutation.mutate({ key: 'mid_interval_minutes', value: minutes });
  }

  function handleTest(transcript: string) {
    testMutation.mutate(transcript);
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Helena</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Configure o copiloto de reunioes da Helena.
        </p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <HelenaKnowledgeSection
          documents={documents}
          isLoading={docsLoading}
          listError={docsError as Error | null}
          onUpload={(file) => uploadMutation.mutate(file)}
          isUploading={uploadMutation.isPending}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </motion.div>

      <motion.div variants={staggerItem} className="border-t border-[var(--border-hairline)] pt-6 mt-6">
        <HelenaWindowConfigSection
          config={config}
          isLoading={configLoading}
          onToggle={handleToggle}
          onIntervalChange={handleIntervalChange}
          isSaving={configMutation.isPending}
        />
      </motion.div>

      <motion.div variants={staggerItem} className="border-t border-[var(--border-hairline)] pt-6 mt-6">
        <HelenaTesterSection
          onTest={handleTest}
          result={testResult}
          isLoading={testMutation.isPending}
          error={testError}
        />
      </motion.div>

      <motion.div variants={staggerItem} className="border-t border-[var(--border-hairline)] pt-6 mt-6">
        <HelenaAnalyticsSection
          analytics={analytics}
          isLoading={analyticsLoading}
        />
      </motion.div>
    </motion.div>
  );
}
