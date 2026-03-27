import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchApplications,
  deleteApplication,
  duplicateApplication,
  fetchTemplates,
  createFromTemplate,
  applicationKeys,
  type Application,
} from '../../../api/applications.ts';

export type FilterTab = 'all' | 'published' | 'draft' | 'archived';

export function useAplicacoes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const { data: applications = [], isLoading, isError, error } = useQuery({
    queryKey: applicationKeys.lists(),
    queryFn: fetchApplications,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: () => { invalidateList(); setDeleteTarget(null); },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateApplication(id),
    onSuccess: invalidateList,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
    enabled: showTemplateModal,
    staleTime: 300_000,
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: (templateId: string) => createFromTemplate(templateId),
    onSuccess: (app) => { setShowTemplateModal(false); invalidateList(); navigate(`/aplicacoes/${app.id}/editor`); },
  });

  const STATUS_ORDER: Record<string, number> = { published: 0, draft: 1, archived: 2 };

  const filtered = applications
    .filter((app) => {
      const matchesFilter =
        (activeFilter === 'all' && app.status !== 'archived') ||
        (activeFilter === 'published' && app.status === 'published') ||
        (activeFilter === 'draft' && app.status === 'draft') ||
        (activeFilter === 'archived' && app.status === 'archived');
      const matchesSearch = search.trim() === '' || app.title.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return b.response_count - a.response_count;
    });

  return {
    applications, filtered, templates, isLoading, isError, error,
    activeFilter, setActiveFilter, search, setSearch,
    clearFilters: () => { setSearch(''); setActiveFilter('all'); },
    createOpen, setCreateOpen,
    deleteTarget, setDeleteTarget,
    handleConfirmDelete: () => { if (deleteTarget) deleteMutation.mutate(deleteTarget); },
    isDeleting: deleteMutation.isPending,
    handleDuplicate: (id: string) => duplicateMutation.mutate(id),
    showTemplateModal, setShowTemplateModal,
    handleCreateFromTemplate: (id: string) => createFromTemplateMutation.mutate(id),
    isCreatingFromTemplate: createFromTemplateMutation.isPending,
  } as const;
}

export type { Application };
