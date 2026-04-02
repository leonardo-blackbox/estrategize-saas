import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CardActionsProps {
  consultancyId: string;
  isArchived: boolean;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onUnarchive: (id: string) => void;
}

export function CardActions({ consultancyId, isArchived, onArchive, onDelete, onUnarchive }: CardActionsProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.14 }}
      className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 py-2"
      style={{
        background: 'linear-gradient(to top, var(--bg-surface-2) 60%, transparent)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => navigate(`/consultorias/${consultancyId}/ai`)}
        className="flex-1 rounded-[var(--radius-sm)] py-1 text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #00c896)' }}
      >
        IA Dedicada
      </button>
      {isArchived ? (
        <button
          onClick={() => onUnarchive(consultancyId)}
          className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold transition-colors hover:text-[var(--accent)]"
          style={{ background: 'var(--bg-surface-1)', color: 'var(--text-muted)', border: '1px solid var(--border-hairline)' }}
        >
          Reativar
        </button>
      ) : (
        <button
          onClick={() => onArchive(consultancyId)}
          className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold transition-colors hover:text-[#fbbf24]"
          style={{ background: 'var(--bg-surface-1)', color: 'var(--text-muted)', border: '1px solid var(--border-hairline)' }}
        >
          Arquivar
        </button>
      )}
      <button
        onClick={() => onDelete(consultancyId)}
        className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold transition-colors hover:text-[#f87171]"
        style={{ background: 'var(--bg-surface-1)', color: 'var(--text-muted)', border: '1px solid var(--border-hairline)' }}
      >
        Excluir
      </button>
    </motion.div>
  );
}
