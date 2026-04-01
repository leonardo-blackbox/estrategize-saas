import { motion } from 'framer-motion';
import type { Consultancy } from '../../services/consultorias.api.ts';
import { ConsultoriaCard } from '../ConsultoriaCard';
import { ConsultoriasEmptyState } from '../ConsultoriasEmptyState';
import { SkeletonCard } from '../SkeletonCard';

interface ConsultoriasGridProps {
  consultancies: Consultancy[];
  isLoading: boolean;
  hasSearch: boolean;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onUnarchive: (id: string) => void;
  archived: Consultancy[];
  archivedVisible: boolean;
  onToggleArchived: () => void;
  onCreateClick: () => void;
}

export function ConsultoriasGrid({
  consultancies,
  isLoading,
  hasSearch,
  onArchive,
  onDelete,
  onUnarchive,
  archived,
  archivedVisible,
  onToggleArchived,
  onCreateClick,
}: ConsultoriasGridProps) {
  const cardProps = { onArchive, onDelete, onUnarchive };

  return (
    <div className="flex-1 min-w-0 space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : consultancies.length === 0 ? (
        <ConsultoriasEmptyState hasSearch={hasSearch} onCreateClick={onCreateClick} />
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {consultancies.map((c) => (
            <ConsultoriaCard key={c.id} consultancy={c} {...cardProps} />
          ))}
        </motion.div>
      )}

      {archived.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={onToggleArchived}
            className="text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {archivedVisible ? `Ocultar arquivadas (${archived.length})` : `Arquivadas (${archived.length})`}
          </button>

          {archivedVisible && (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {archived.map((c) => (
                <ConsultoriaCard key={c.id} consultancy={c} {...cardProps} />
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
