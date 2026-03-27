import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConsultancy,
  fetchAIContext,
  consultancyKeys,
  client,
  type Diagnosis,
} from '../services/consultorias.api.ts';
import type { TabKey } from '../consultorias.detail.types.ts';

export function useConsultoriaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const {
    data: consultancyData,
    isLoading: consultancyLoading,
    isError: consultancyError,
  } = useQuery({
    queryKey: consultancyKeys.detail(id!),
    queryFn: () => fetchConsultancy(id!),
    enabled: !!id,
  });

  const {
    data: aiContextData,
    isLoading: aiContextLoading,
  } = useQuery({
    queryKey: consultancyKeys.aiContext(id!),
    queryFn: () => fetchAIContext(id!),
    enabled: !!id,
    retry: false,
    staleTime: 60_000,
  });

  const generateDiagnosisMutation = useMutation({
    mutationFn: () =>
      client.post(`/api/consultancies/${id}/diagnose`).json<{ data: Diagnosis }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diagnosis', id] });
      setActiveTab('diagnosis');
    },
  });

  const consultancy = consultancyData?.data ?? null;
  const insights = aiContextData?.insights ?? null;

  return {
    id,
    navigate,
    activeTab,
    setActiveTab,
    consultancy,
    consultancyLoading,
    consultancyError,
    insights,
    aiContextLoading,
    generateDiagnosis: () => generateDiagnosisMutation.mutate(),
  };
}
