import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHomeSettings,
  adminUpdateHomeSettings,
  adminGetFormacaoSections,
  adminCreateSection,
  adminUpdateSection,
  adminDeleteSection,
  adminReorderSections,
} from '../services/admin.api.ts';

export function useAdminHome() {
  const qc = useQueryClient();

  // ── Settings ──
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [saved, setSaved] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['home-settings'],
    queryFn: getHomeSettings,
  });

  useEffect(() => {
    if (settings && !settingsLoaded) {
      setTitle(settings.title);
      setSubtitle(settings.subtitle ?? '');
      setSettingsLoaded(true);
    }
  }, [settings, settingsLoaded]);

  const saveMutation = useMutation({
    mutationFn: () =>
      adminUpdateHomeSettings({
        title: title.trim() || 'Formação',
        subtitle: subtitle.trim() || null,
      }),
    onSuccess: (data) => {
      qc.setQueryData(['home-settings'], data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // ── Sections ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [managingSection, setManagingSection] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['admin-formacao-sections'],
    queryFn: adminGetFormacaoSections,
  });

  const sectionList = sections as any[];

  const createMutation = useMutation({
    mutationFn: (t: string) =>
      adminCreateSection({ title: t, sort_order: sectionList.length }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] });
      setShowCreateModal(false);
      setNewSectionTitle('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminUpdateSection(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteSection(id, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] });
      setConfirmDelete(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) =>
      adminReorderSections(items),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] }),
  });

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const list = [...sectionList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
    const items = list.map((s, i) => ({ id: s.id, sort_order: i }));
    reorderMutation.mutate(items);
  };

  const invalidateSections = () =>
    qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] });

  return {
    // Settings
    title, setTitle, subtitle, setSubtitle,
    saved, settingsLoading, saveMutation,
    previewTitle: title.trim() || 'Formação',
    previewSubtitle: subtitle.trim(),
    // Sections
    sectionList, sectionsLoading,
    showCreateModal, setShowCreateModal,
    newSectionTitle, setNewSectionTitle,
    editingId, setEditingId,
    editTitle, setEditTitle,
    managingSection, setManagingSection,
    confirmDelete, setConfirmDelete,
    openStatusDropdown, setOpenStatusDropdown,
    createMutation, updateMutation, deleteMutation, reorderMutation,
    moveSection, invalidateSections,
  };
}
