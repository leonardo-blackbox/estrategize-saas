import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import { Button } from '../../../../components/ui/Button.tsx';

interface ConsultoriasHeaderProps {
  isLoading: boolean;
  activeCount: number;
  onCreateClick: () => void;
}

export function ConsultoriasHeader({
  isLoading,
  activeCount,
  onCreateClick,
}: ConsultoriasHeaderProps) {
  return (
    <motion.div variants={staggerItem} className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Consultorias</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          {isLoading ? 'Carregando…' : `${activeCount} ativas`}
        </p>
      </div>
      <Button size="sm" onClick={onCreateClick}>
        + Nova Consultoria
      </Button>
    </motion.div>
  );
}
