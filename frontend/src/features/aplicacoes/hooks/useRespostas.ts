import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import {
  fetchApplication,
  fetchResponses,
  exportResponses,
  deleteResponse,
  applicationKeys,
} from '../services/aplicacoes.api';
import type { ResponseWithAnswers, ApplicationField } from '../services/aplicacoes.api';
import {
  formatDate,
  resolveValue,
  getCollectibleFields,
  type ViewMode,
  type DateFilter,
} from '../utils/respostas.helpers';

export function useRespostas() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward');
  const [isExporting, setIsExporting] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showUTMColumns, setShowUTMColumns] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: applicationKeys.detail(id!),
    queryFn: () => fetchApplication(id!),
    enabled: Boolean(id),
  });

  const { data: responsesData, isLoading: responsesLoading } = useQuery({
    queryKey: applicationKeys.responses(id!),
    queryFn: () => fetchResponses(id!, 1, 200),
    enabled: Boolean(id),
  });

  const { mutate: deleteResponseMutation } = useMutation({
    mutationFn: (responseId: string) => deleteResponse(id!, responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.responses(id!) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id!) });
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    },
  });

  const responses: ResponseWithAnswers[] = responsesData?.data ?? [];
  const fields: ApplicationField[] = application?.fields ?? [];
  const collectibleFields = getCollectibleFields(fields);

  const filteredResponses = useMemo(() => {
    if (!responses) return [];
    if (dateFilter === 'all') return responses;
    const now = new Date();
    const since = new Date();
    if (dateFilter === 'today') since.setHours(0, 0, 0, 0);
    else if (dateFilter === '7d') since.setDate(now.getDate() - 7);
    else if (dateFilter === '30d') since.setDate(now.getDate() - 30);
    return responses.filter((r) => new Date(r.created_at) >= since);
  }, [responses, dateFilter]);

  const selectedResponse = filteredResponses[selectedIndex] ?? null;
  const isLoading = appLoading || responsesLoading;
  const sidebarCollapsed = viewMode === 'tabela';
  const hasUTMData = filteredResponses.some((r) =>
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].some(
      (k) => r.metadata?.[k],
    ),
  );

  const handleSelectResponse = useCallback(
    (idx: number) => {
      setNavDirection(idx > selectedIndex ? 'forward' : 'back');
      setSelectedIndex(idx);
    },
    [selectedIndex],
  );

  const handlePrev = useCallback(() => {
    if (selectedIndex === 0) return;
    setNavDirection('back');
    setSelectedIndex((prev) => prev - 1);
  }, [selectedIndex]);

  const handleNext = useCallback(() => {
    if (selectedIndex >= filteredResponses.length - 1) return;
    setNavDirection('forward');
    setSelectedIndex((prev) => prev + 1);
  }, [selectedIndex, filteredResponses.length]);

  const handleExport = useCallback(async () => {
    if (!id || !application) return;
    setIsExporting(true);
    try {
      const allResponses = await exportResponses(id);
      const headers = ['#', 'Data', ...collectibleFields.map((f) => f.title)];
      const rows = allResponses.map((r, idx) => {
        const row: Record<string, string> = {
          '#': String(idx + 1),
          Data: formatDate(r.submitted_at || r.created_at),
        };
        collectibleFields.forEach((f) => {
          const answer = r.answers.find((a) => a.field_id === f.id);
          row[f.title] = answer ? resolveValue(answer, fields) : '';
        });
        return row;
      });
      const csv = Papa.unparse({
        fields: headers,
        data: rows.map((r) => headers.map((h) => r[h] ?? '')),
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respostas-${application.slug}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [id, application, collectibleFields, fields]);

  return {
    application,
    responses,
    fields,
    collectibleFields,
    filteredResponses,
    selectedResponse,
    selectedIndex,
    navDirection,
    viewMode,
    dateFilter,
    showUTMColumns,
    isLoading,
    isExporting,
    sidebarCollapsed,
    hasUTMData,
    mobileShowDetail,
    setViewMode,
    setDateFilter,
    setShowUTMColumns,
    setMobileShowDetail,
    setSelectedIndex,
    handleSelectResponse,
    handlePrev,
    handleNext,
    handleExport,
    deleteResponseMutation,
  };
}
