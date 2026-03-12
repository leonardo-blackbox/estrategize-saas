import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { adminGetUsers } from '../../api/courses.ts';

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
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(search);
  const limit = 20;
  const offset = page * limit;

  const { data: usersData, isLoading, error: usersError } = useQuery({
    queryKey: ['admin-users', debouncedSearch, offset],
    queryFn: () => adminGetUsers({ q: debouncedSearch || undefined, limit, offset }),
  });

  const users = (usersData as any)?.users ?? [];
  const total = (usersData as any)?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

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
          {total > 0 ? `${total} usuários cadastrados` : 'Gerencie acessos, entitlements e matrículas.'}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div variants={staggerItem}>
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </motion.div>

      {/* User list */}
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
            <button
              key={user.id}
              onClick={() => navigate(`/admin/usuarios/${user.id}`)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border text-left transition-colors',
                'bg-[var(--bg-surface-1)] border-[var(--border-hairline)] hover:border-[var(--border-default)]',
              )}
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
                {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {user.full_name ?? user.email ?? '—'}
                </p>
                {user.full_name && (
                  <p className="text-xs text-[var(--text-tertiary)] truncate">{user.email}</p>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {user.role === 'admin' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--text-primary)] text-[var(--bg-base)]">
                    Admin
                  </span>
                )}
                <svg className="h-4 w-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
          ))
        )}
      </motion.div>

      {/* Pagination */}
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
