import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConsultancies,
  updateConsultancy,
  consultancyKeys,
  type Consultancy,
  type ConsultancyStats,
} from '../services/consultorias.api.ts';
import { type SortOption, type PhaseFilter, PRIORITY_WEIGHT } from '../consultorias.helpers.ts';

export function useConsultorias() {
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const qc = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: (id: string) => updateConsultancy(id, { status: 'archived' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultancyKeys.all });
      setSelectedId(null);
    },
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: consultancyKeys.all,
    queryFn: fetchConsultancies,
    staleTime: 30_000,
  });

  const consultancies: Consultancy[] = data?.data ?? [];
  const stats: ConsultancyStats = data?.stats ?? {
    total: 0,
    active: 0,
    onboarding: 0,
    meetings_this_week: 0,
    at_risk: 0,
  };

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const filtered = consultancies
    .filter((c) => c.status === 'active')
    .filter((c) => phaseFilter === 'all' || c.phase === phaseFilter)
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

  const selected = consultancies.find((c) => c.id === selectedId) ?? null;

  const handleSelect = useCallback((c: Consultancy) => {
    setSelectedId((prev) => (prev === c.id ? null : c.id));
  }, []);

  const handleArchive = useCallback(
    (id: string) => {
      archiveMutation.mutate(id);
    },
    [archiveMutation],
  );

  return {
    // Data
    stats,
    filtered,
    selected,
    isLoading,
    isError,
    error,
    // Filters
    phaseFilter,
    setPhaseFilter,
    sortBy,
    setSortBy,
    search,
    setSearch,
    debouncedSearch,
    // Selection
    selectedId,
    handleSelect,
    handleArchive,
    // Create modal
    showCreate,
    setShowCreate,
  };
}
