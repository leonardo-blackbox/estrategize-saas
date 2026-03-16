import { useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  fetchApplication,
  applicationKeys,
} from '../../../api/applications.ts';
import { useEditorStore } from '../../../stores/editorStore.ts';
import { FieldsListPanel } from '../../../components/aplicacoes/editor/FieldsList.tsx';
import { LivePreviewPanel } from '../../../components/aplicacoes/editor/LivePreview.tsx';
import { FieldOptionsPanel } from '../../../components/aplicacoes/editor/FieldOptions.tsx';
import type { ApplicationShellContext } from './ApplicationShell.tsx';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading: shellLoading } = useOutletContext<ApplicationShellContext>();
  const { loadApplication, reset } = useEditorStore();

  const { data, isLoading, error } = useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => fetchApplication(id ?? ''),
    enabled: Boolean(id),
    staleTime: 0,
  });

  useEffect(() => {
    if (data) loadApplication(data);
  }, [data, loadApplication]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  if (isLoading || shellLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="inline-block w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !id) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-[var(--text-secondary)] text-[14px]">
          Não foi possível carregar o formulário.
        </p>
        <a href="/aplicacoes" className="text-[var(--accent)] text-[13px] underline">
          ← Voltar para Aplicações
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 320px',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ gridColumn: '1', overflow: 'hidden' }}>
        <FieldsListPanel />
      </div>
      <div style={{ gridColumn: '2', overflow: 'hidden' }}>
        <LivePreviewPanel />
      </div>
      <div style={{ gridColumn: '3', overflow: 'hidden' }}>
        <FieldOptionsPanel />
      </div>
    </div>
  );
}
