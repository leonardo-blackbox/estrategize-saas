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
import { listMeetings, meetingKeys, type MeetingSession } from '../../../api/meetings.ts';
import { fetchConsultancyPlugins, pluginKeys } from '../../../api/plugins.ts';
import { BASE_TABS, PLUGIN_TAB_MAP, type TabKey, type TabDef } from '../consultorias.detail.types.ts';

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

  const { data: meetingsData } = useQuery({
    queryKey: meetingKeys.byConsultancy(id!),
    queryFn: () => listMeetings(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

  const { data: pluginsData } = useQuery({
    queryKey: pluginKeys.byConsultancy(id!),
    queryFn: () => fetchConsultancyPlugins(id!),
    enabled: !!id,
    staleTime: 30_000,
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
  const recentMeetings: MeetingSession[] = (meetingsData?.sessions ?? [])
    .filter((s) => s.status === 'done' && s.summary)
    .slice(0, 3);

  const installedPluginSlugs = (pluginsData ?? []).map((p) => p.plugin_slug);
  const pluginTabs: TabDef[] = installedPluginSlugs
    .map((slug) => PLUGIN_TAB_MAP[slug])
    .filter((tab): tab is TabDef => !!tab);
  const tabs: TabDef[] = [...BASE_TABS, ...pluginTabs];
  const hasMeetingsPlugin = installedPluginSlugs.includes('transcricao-reuniao');

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
    recentMeetings,
    generateDiagnosis: () => generateDiagnosisMutation.mutate(),
    tabs,
    hasMeetingsPlugin,
  };
}
