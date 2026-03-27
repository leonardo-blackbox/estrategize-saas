import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminGetUser } from '../services/admin.api.ts';

export type TabId = 'overview' | 'courses' | 'credits' | 'history';

export const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Visao Geral' },
  { id: 'courses', label: 'Cursos & Acesso' },
  { id: 'credits', label: 'Creditos' },
  { id: 'history', label: 'Historico' },
];

export function useAdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: userDetail, isLoading, error } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminGetUser(id!),
    enabled: !!id,
  });

  const detail = userDetail as any;
  const displayName = detail?.profile?.full_name ?? detail?.authUser?.email ?? id;

  const invalidateUsers = () =>
    qc.invalidateQueries({ queryKey: ['admin-users'] });

  return {
    id, navigate, qc, detail, isLoading, error,
    activeTab, setActiveTab, displayName, invalidateUsers,
  };
}
