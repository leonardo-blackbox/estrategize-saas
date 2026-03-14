import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { fetchConsultancies, type Consultancy } from '../../api/consultancies.ts';
import { client } from '../../api/client.ts';

type FilterValue = 'all' | 'active' | 'archived';

const statusConfig: Record<'active' | 'archived', { label: string; badgeVariant: 'success' | 'locked' }> = {
  active: { label: 'Ativa', badgeVariant: 'success' },
  archived: { label: 'Arquivada', badgeVariant: 'locked' },
};

const filterLabels: Record<FilterValue, string> = {
  all: 'Todas',
  active: 'Ativas',
  archived: 'Arquivadas',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'agora mesmo';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  if (diffDay < 7) return `${diffDay}d atrás`;
  if (diffWeek < 5) return `${diffWeek} sem. atrás`;
  if (diffMonth < 12) return `${diffMonth} meses atrás`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-40 rounded bg-[var(--bg-hover)] animate-pulse" />
          <div className="h-4 w-12 rounded-full bg-[var(--bg-hover)] animate-pulse" />
        </div>
        <div className="h-3 w-28 rounded bg-[var(--bg-hover)] animate-pulse" />
      </div>
      <div className="h-4 w-4 rounded bg-[var(--bg-hover)] animate-pulse shrink-0" />
    </div>
  );
}

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateConsultoriaModal({ open, onClose }: CreateModalProps) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [titleError, setTitleError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; client_name?: string }) =>
      client.post('/api/consultancies', { json: payload }).json<{ data: Consultancy }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultancies'] });
      handleClose();
    },
    onError: (err: Error) => {
      setMutationError(err.message || 'Erro ao criar consultoria. Tente novamente.');
    },
  });

  function handleClose() {
    setTitle('');
    setClientName('');
    setTitleError('');
    setMutationError('');
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('O título é obrigatório.');
      return;
    }
    setTitleError('');
    setMutationError('');
    createMutation.mutate({
      title: title.trim(),
      ...(clientName.trim() ? { client_name: clientName.trim() } : {}),
    });
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Nova Consultoria</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            Preencha os dados básicos para começar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            placeholder="Ex: Plano Estratégico 2026"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError('');
            }}
            error={titleError}
            disabled={createMutation.isPending}
            autoFocus
          />
          <Input
            label="Empresa (opcional)"
            placeholder="Ex: Acme Corp"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            disabled={createMutation.isPending}
          />

          <AnimatePresence>
            {mutationError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[12px] text-[var(--color-error)]"
              >
                {mutationError}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Criando…' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function ConsultoriasPage() {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['consultancies'],
    queryFn: fetchConsultancies,
    staleTime: 30_000,
  });

  const consultancies = data?.data ?? [];
  const filtered = filter === 'all' ? consultancies : consultancies.filter((c) => c.status === filter);

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={staggerItem} className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Consultorias</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {isLoading
                ? 'Carregando…'
                : `${consultancies.length} ${consultancies.length === 1 ? 'consultoria' : 'consultorias'}`}
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            Nova Consultoria
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div variants={staggerItem} className="flex gap-1">
          {(['all', 'active', 'archived'] as FilterValue[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
              )}
            >
              {filterLabels[f]}
            </button>
          ))}
        </motion.div>

        {/* Loading skeletons */}
        {isLoading && (
          <motion.div variants={staggerItem} className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </motion.div>
        )}

        {/* Error state */}
        {isError && (
          <motion.div
            variants={staggerItem}
            className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
          >
            <p className="text-sm text-[var(--color-error)]">
              {(error as Error)?.message || 'Erro ao carregar consultorias.'}
            </p>
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <motion.div
            variants={staggerItem}
            className="flex flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <div className="h-12 w-12 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex items-center justify-center">
              <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {filter === 'all'
                  ? 'Você ainda não tem consultorias.'
                  : `Nenhuma consultoria ${filterLabels[filter].toLowerCase()}.`}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {filter === 'all' ? 'Crie uma para começar.' : 'Altere o filtro ou crie uma nova.'}
              </p>
            </div>
            {filter === 'all' && (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                Criar Consultoria
              </Button>
            )}
          </motion.div>
        )}

        {/* List */}
        {!isLoading && !isError && filtered.length > 0 && (
          <motion.div variants={staggerItem} className="space-y-2">
            {filtered.map((c) => {
              const config = statusConfig[c.status];
              return (
                <motion.div key={c.id} variants={staggerItem}>
                  <Link
                    to={`/consultorias/${c.id}`}
                    className={cn(
                      'flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4',
                      'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                      'hover:border-[var(--border-default)] hover:-translate-y-0.5',
                      'transition-all duration-200',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {c.title}
                        </h3>
                        <Badge variant={config.badgeVariant}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {c.client_name ? `${c.client_name} · ` : ''}
                        {timeAgo(c.created_at)}
                      </p>
                    </div>
                    <svg
                      className="h-4 w-4 text-[var(--text-muted)] shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      <CreateConsultoriaModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
