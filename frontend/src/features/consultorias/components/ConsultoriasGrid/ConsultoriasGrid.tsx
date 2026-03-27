import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import type { Consultancy } from '../../services/consultorias.api.ts';
import { ConsultoriaCard } from '../ConsultoriaCard';
import { ConsultoriasEmptyState } from '../ConsultoriasEmptyState';
import { SkeletonCard } from '../SkeletonCard';

interface ConsultoriasGridProps {
  consultancies: Consultancy[];
  selectedId: string | null;
  isLoading: boolean;
  hasSearch: boolean;
  onSelect: (c: Consultancy) => void;
  onArchive: (id: string) => void;
  onCreateClick: () => void;
}

export function ConsultoriasGrid({
  consultancies,
  selectedId,
  isLoading,
  hasSearch,
  onSelect,
  onArchive,
  onCreateClick,
}: ConsultoriasGridProps) {
  return (
    <motion.div variants={staggerItem} className="flex-1 min-w-0">
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
            <ConsultoriaCard
              key={c.id}
              consultancy={c}
              selected={selectedId === c.id}
              onSelect={onSelect}
              onArchive={onArchive}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
