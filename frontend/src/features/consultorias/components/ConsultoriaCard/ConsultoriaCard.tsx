import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import type { Consultancy } from '../../services/consultorias.api.ts';
import { CardHeader } from './CardHeader';
import { CardProgress } from './CardProgress';
import { CardFooter } from './CardFooter';
import { CardActions } from './CardActions';

interface ConsultoriaCardProps {
  consultancy: Consultancy;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onUnarchive: (id: string) => void;
}

export function ConsultoriaCard({ consultancy: c, onArchive, onDelete, onUnarchive }: ConsultoriaCardProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const isArchived = c.status === 'archived';
  const score = Math.min(100, Math.max(0, c.implementation_score ?? 0));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate('/consultorias/' + c.id)}
      className={cn(
        'relative rounded-[var(--radius-md)] p-4 cursor-pointer overflow-hidden',
        'transition-all duration-200',
        isArchived && 'opacity-50',
      )}
      style={{
        background: hovered ? 'var(--bg-surface-2)' : 'var(--bg-surface-1)',
        border: `1px solid ${hovered ? 'var(--border-subtle)' : 'var(--border-hairline)'}`,
        boxShadow: hovered
          ? '0 8px 32px -4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset'
          : '0 2px 8px rgba(0,0,0,0.2)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {c.priority === 'at_risk' && (
        <div
          className="absolute left-0 inset-y-0 w-[3px] rounded-l-[var(--radius-md)]"
          style={{ background: 'linear-gradient(180deg, #ef4444, #dc2626)' }}
        />
      )}

      <CardHeader consultancy={c} />

      <div className="h-px mb-3" style={{ background: 'var(--border-hairline)' }} />

      <CardProgress score={score} />

      <CardFooter consultancy={c} />

      <AnimatePresence>
        {hovered && (
          <CardActions
            consultancyId={c.id}
            isArchived={isArchived}
            onArchive={onArchive}
            onDelete={onDelete}
            onUnarchive={onUnarchive}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
