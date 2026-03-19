import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../../lib/cn.ts';
import {
  fetchApplication,
  applicationKeys,
} from '../../../api/applications.ts';
import { useEditorStore } from '../../../stores/editorStore.ts';
import { FieldsListPanel } from '../../../components/aplicacoes/editor/FieldsList.tsx';
import { LivePreviewPanel } from '../../../components/aplicacoes/editor/LivePreview.tsx';
import { FieldOptionsPanel } from '../../../components/aplicacoes/editor/FieldOptions.tsx';
import type { ApplicationShellContext } from './ApplicationShell.tsx';

type MobilePanel = 'fields' | 'preview' | 'options';

const MOBILE_TABS: { id: MobilePanel; label: string }[] = [
  { id: 'fields', label: 'Campos' },
  { id: 'preview', label: 'Prévia' },
  { id: 'options', label: 'Opções' },
];

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading: shellLoading } = useOutletContext<ApplicationShellContext>();
  const { loadApplication, reset } = useEditorStore();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('preview');

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Mobile tab switcher */}
      <div className="md:hidden flex shrink-0 border-b border-[var(--border-hairline)] bg-[var(--bg-surface-1)]">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobilePanel(tab.id)}
            className={cn(
              'flex-1 py-2.5 text-[12px] font-medium transition-colors',
              mobilePanel === tab.id
                ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent)] -mb-px'
                : 'text-[var(--text-tertiary)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop: 3-column grid */}
      <div
        className="hidden md:grid"
        style={{ gridTemplateColumns: '260px 1fr 320px', flex: 1, overflow: 'hidden' }}
      >
        <div style={{ overflow: 'hidden' }}><FieldsListPanel /></div>
        <div style={{ overflow: 'hidden' }}><LivePreviewPanel /></div>
        <div style={{ overflow: 'hidden' }}><FieldOptionsPanel /></div>
      </div>

      {/* Mobile: single active panel */}
      <div className="md:hidden" style={{ flex: 1, overflow: 'hidden' }}>
        {mobilePanel === 'fields' && <FieldsListPanel />}
        {mobilePanel === 'preview' && <LivePreviewPanel />}
        {mobilePanel === 'options' && <FieldOptionsPanel />}
      </div>
    </div>
  );
}
