import { motion } from 'framer-motion';

interface CardProgressProps {
  score: number;
}

export function CardProgress({ score }: CardProgressProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Implementação
        </span>
        <span
          className="text-[11px] font-bold tabular-nums"
          style={{ color: score > 0 ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          {score}%
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: 'var(--bg-surface-2)' }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.1 }}
          style={{
            background: score >= 70
              ? 'linear-gradient(90deg, #00c896, #00e5cc)'
              : score >= 30
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #6b7280, #9ca3af)',
          }}
        />
      </div>
    </div>
  );
}
