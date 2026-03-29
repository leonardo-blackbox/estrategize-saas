import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { adminGetUsers, adminGetPlansSummary } from '../../../../api/courses.ts';
import { UserFilters } from './UserFilters.tsx';
import { UserRow } from './UserRow.tsx';

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function AdminUsuariosPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [planId, setPlanId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(search);
  const limit = 20;
  const offset = page * limit;

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans-summary'],
    queryFn: adminGetPlansSummary,
  });

  const { data: usersData, isLoading, error: usersError } = useQuery({
    queryKey: ['admin-users', debouncedSearch, planId, status, offset],
    queryFn: () => adminGetUsers({
      q: debouncedSearch || undefined,
      plan_id: planId || undefined,
      status: status || undefined,
      limit,
      offset,
    }),
  });

  const users = (usersData as any)?.users ?? [];
  const total = (usersData as any)?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  function handleSearchChange(value: string) { setSearch(value); setPage(0); }
  function handlePlanIdChange(value: string) { setPlanId(value); setPage(0); }
  function handleStatusChange(value: string) { setStatus(value); setPage(0); }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Usuários</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {total > 0 ? `${total} usuários encontrados` : 'Gerencie acessos, entitlements e matrículas.'}
        </p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <UserFilters
          search={search}
          onSearchChange={handleSearchChange}
          planId={planId}
          onPlanIdChange={handlePlanIdChange}
          status={status}
          onStatusChange={handleStatusChange}
          plans={plans}
        />
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-1">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
          ))
        ) : usersError ? (
          <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-2">
            <p className="text-sm text-red-500 font-medium">Erro ao carregar usuários</p>
            <p className="text-xs text-[var(--text-tertiary)] font-mono break-all">
              {(usersError as Error).message}
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          users.map((user: any) => (
            <UserRow
              key={user.id}
              user={user}
              onClick={() => navigate(`/admin/usuarios/${user.id}`)}
            />
          ))
        )}
      </motion.div>

      {totalPages > 1 && (
        <motion.div variants={staggerItem} className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">
            {offset + 1}–{Math.min(offset + limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Próximo
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
