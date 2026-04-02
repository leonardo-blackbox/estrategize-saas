import { useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchApplication,
  updateApplication,
  applicationKeys,
} from '../../../api/applications.ts';

export interface ApplicationShellContext {
  application: ReturnType<typeof useApplicationShell>['application'];
  isLoading: boolean;
  refetch: () => void;
}

const TABS = [
  { id: 'editor', label: 'Editor' },
  { id: 'opcoes', label: 'Opções' },
  { id: 'compartilhar', label: 'Compartilhar' },
  { id: 'integracoes', label: 'Integrações' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'respostas', label: 'Respostas' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export { TABS };

export function useApplicationShell() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<{ message: string; link?: string } | null>(null);

  const {
    data: application,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => fetchApplication(id ?? ''),
    enabled: Boolean(id),
    staleTime: 0,
  });

  const publishMutation = useMutation({
    mutationFn: ({ newStatus }: { newStatus: 'draft' | 'published' }) =>
      updateApplication(id!, { status: newStatus }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id!) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      if (updated.status === 'published') {
        const formUrl = `${window.location.origin}/f/${updated.slug}`;
        setToast({ message: 'Formulário publicado!', link: formUrl });
      } else {
        setToast({ message: 'Formulário despublicado.' });
      }
    },
  });

  const titleMutation = useMutation({
    mutationFn: (title: string) => updateApplication(id!, { title }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id!) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });

  const handlePublishToggle = useCallback(() => {
    if (!id || !application) return;
    const newStatus = application.status === 'published' ? 'draft' : 'published';
    publishMutation.mutate({ newStatus });
  }, [id, application, publishMutation]);

  const handleCopyLink = useCallback(() => {
    if (!application) return;
    const url = `${window.location.origin}/f/${application.slug}`;
    navigator.clipboard.writeText(url).catch(() => null);
    setToast({ message: 'Link copiado!' });
  }, [application]);

  const activeTab = TABS.find((t) =>
    location.pathname.endsWith(`/${t.id}`),
  )?.id ?? 'respostas';

  const isEditorTab = activeTab === 'editor';
  const status = application?.status ?? 'draft';
  const publicUrl = application ? `${window.location.origin}/f/${application.slug}` : '';

  return {
    id,
    application,
    isLoading,
    refetch,
    toast,
    setToast,
    publishMutation,
    titleMutation,
    handlePublishToggle,
    handleCopyLink,
    activeTab,
    isEditorTab,
    status,
    publicUrl,
  };
}
