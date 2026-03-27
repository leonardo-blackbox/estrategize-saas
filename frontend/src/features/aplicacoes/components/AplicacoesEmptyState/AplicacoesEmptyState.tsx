import { motion } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';

interface AplicacoesEmptyStateProps {
  onCreateClick: () => void;
}

export function AplicacoesEmptyState({ onCreateClick }: AplicacoesEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div
        className={cn(
          'w-20 h-20 rounded-2xl mb-6 flex items-center justify-center',
          'bg-[var(--bg-surface-1)] ring-1 ring-[var(--border-hairline)]',
        )}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="6" y="4" width="24" height="28" rx="3" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none" />
          <line x1="11" y1="12" x2="25" y2="12" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11" y1="17" x2="25" y2="17" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11" y1="22" x2="20" y2="22" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="26" cy="26" r="5" fill="#7c5cfc" />
          <line x1="26" y1="23" x2="26" y2="29" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="23" y1="26" x2="29" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">
        Nenhuma aplicação ainda
      </h3>
      <p className="text-[14px] text-[var(--text-secondary)] max-w-sm leading-relaxed mb-8">
        Crie seu primeiro formulário e comece a coletar respostas em minutos.
      </p>

      <Button onClick={onCreateClick} className="gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Criar primeira aplicação
      </Button>
    </motion.div>
  );
}
