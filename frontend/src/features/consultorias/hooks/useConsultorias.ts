import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchConsultancies,
  updateConsultancy,
  deleteConsultancy,
  consultancyKeys,
  type Consultancy,
  type ConsultancyStats,
} from '../services/consultorias.api.ts';
import { type SortOption, type PhaseFilter, type StatusFilter, PRIORITY_WEIGHT } from '../consultorias.helpers.ts';
import { useDebounce } from '../../../hooks/useDebounce.ts';

export function useConsultorias() {
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [archivedVisible, setArchivedVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const qc = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: (id: string) => updateConsultancy(id, { status: 'archived' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultancyKeys.all });
      toast.success('Consultoria arquivada');
    },
    onError: () => toast.error('Erro ao arquivar consultoria'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConsultancy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultancyKeys.all });
      toast.success('Consultoria excluída');
    },
    onError: () => toast.error('Erro ao excluir consultoria'),
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => updateConsultancy(id, { status: 'active' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultancyKeys.all });
      toast.success('Consultoria reativada');
    },
    onError: () => toast.error('Erro ao reativar consultoria'),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: consultancyKeys.all,
    queryFn: fetchConsultancies,
    staleTime: 30_000,
  });

  const consultancies: Consultancy[] = data?.data ?? [];
  const stats: ConsultancyStats = data?.stats ?? { total: 0, active: 0, onboarding: 0, meetings_this_week: 0, at_risk: 0 };

  const archived = consultancies.filter((c) => c.status === 'archived');

  const filtered = consultancies
    .filter((c) => c.status !== 'archived')
    .filter((c) => phaseFilter === 'all' || c.phase === phaseFilter)
    .filter((c) => statusFilter === 'all' || c.priority === statusFilter)
    .filter((c) => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        (c.client_name?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'recent')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'alpha')
        return (a.client_name ?? a.title).localeCompare(b.client_name ?? b.title);
      if (sortBy === 'progress')
        return (b.implementation_score ?? 0) - (a.implementation_score ?? 0);
      if (sortBy === 'priority') {
        const wa = PRIORITY_WEIGHT[a.priority ?? 'low'] ?? 3;
        const wb = PRIORITY_WEIGHT[b.priority ?? 'low'] ?? 3;
        return wa - wb;
      }
      return 0;
    });

  const handleArchive = useCallback((id: string) => { archiveMutation.mutate(id); }, [archiveMutation]);
  const handleDelete = useCallback((id: string) => { deleteMutation.mutate(id); }, [deleteMutation]);
  const handleUnarchive = useCallback((id: string) => { unarchiveMutation.mutate(id); }, [unarchiveMutation]);
  const handleSelect = useCallback((id: string) => { setSelectedId((prev) => (prev === id ? null : id)); }, []);

  const selected = (data?.data ?? []).find((c) => c.id === selectedId) ?? null;

  return {
    // Data
    stats,
    filtered,
    archived,
    isLoading,
    isError,
    error,
    // Filters
    phaseFilter,
    setPhaseFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    search,
    setSearch,
    debouncedSearch,
    // Actions
    handleArchive,
    handleDelete,
    handleUnarchive,
    // Selection
    selectedId,
    selected,
    handleSelect,
    // Archived visibility
    archivedVisible,
    setArchivedVisible,
    // Create modal
    showCreate,
    setShowCreate,
  };
}
