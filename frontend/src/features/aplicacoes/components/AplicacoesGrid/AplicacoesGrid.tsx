import { motion } from 'framer-motion';
import { staggerContainer } from '../../../../lib/motion.ts';
import type { Application } from '../../../../api/applications.ts';
import { AplicacaoCard } from '../AplicacaoCard/index.ts';
import { SkeletonCard } from '../SkeletonCard/index.ts';
import { AplicacoesEmptyState } from '../AplicacoesEmptyState/index.ts';

interface AplicacoesGridProps {
  filtered: Application[];
  allCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  search: string;
  activeFilter: string;
  onCreateClick: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onClearFilters: () => void;
}

const GRID_STYLE = { gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' };

export function AplicacoesGrid({ filtered, allCount, isLoading, isError, error, search, activeFilter, onCreateClick, onDuplicate, onDelete, onClearFilters }: AplicacoesGridProps) {
  if (isError) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-[var(--text-tertiary)] mb-3">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 9v8M16 21v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[14px] font-medium text-[var(--text-primary)]">Erro ao carregar aplicações</p>
      <p className="text-[13px] text-[var(--text-tertiary)] mt-1">{error?.message ?? 'Tente novamente mais tarde.'}</p>
    </div>
  );

  if (isLoading) return (
    <div className="grid gap-4" style={GRID_STYLE}>
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  if (filtered.length === 0 && allCount === 0) return <AplicacoesEmptyState onCreateClick={onCreateClick} />;

  if (filtered.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[14px] text-[var(--text-secondary)]">
        Nenhuma aplicação encontrada para &quot;{search || activeFilter}&quot;.
      </p>
      <button onClick={onClearFilters} className="mt-2 text-[13px] text-[var(--accent)] hover:underline">Limpar filtros</button>
    </div>
  );

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4" style={GRID_STYLE}>
      {filtered.map((app) => (
        <AplicacaoCard key={app.id} app={app} onDuplicate={onDuplicate} onDelete={onDelete} />
      ))}
    </motion.div>
  );
}
