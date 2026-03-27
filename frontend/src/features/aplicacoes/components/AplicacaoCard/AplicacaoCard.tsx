import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { staggerItem } from '../../../../lib/motion.ts';
import type { Application } from '../../../../api/applications.ts';
import { FormThumbnail } from '../FormThumbnail/index.ts';
import { StatusBadge } from '../StatusBadge/index.ts';
import { KebabMenu } from '../KebabMenu/index.ts';

interface AplicacaoCardProps {
  app: Application;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AplicacaoCard({ app, onDuplicate, onDelete }: AplicacaoCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const date = new Date(app.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/f/${app.slug}`).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const visible = isHovered || menuOpen;

  return (
    <motion.div
      variants={staggerItem} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)}
      onClick={() => navigate(`/aplicacoes/${app.id}/respostas`)}
      className={cn(
        'group relative rounded-[var(--radius-md)] cursor-pointer bg-[var(--bg-surface-1)] ring-1 transition-all duration-200',
        visible ? 'ring-[#7c5cfc66] shadow-[0_8px_32px_rgba(124,92,252,0.12)]' : 'ring-[var(--border-hairline)] shadow-none',
      )}
    >
      <div className="rounded-t-[var(--radius-md)] overflow-hidden">
        <FormThumbnail form={app} />
      </div>
      <div className="p-4">
        {copied && (
          <div className="absolute inset-x-0 top-0 flex items-center justify-center pointer-events-none z-10">
            <span className="mt-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-[rgba(124,92,252,0.92)] text-white shadow-lg">
              Link copiado!
            </span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2 mb-2">
          <StatusBadge status={app.status} />
          <motion.div animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.1 }} style={{ pointerEvents: visible ? 'auto' : 'none' }}>
            <KebabMenu
              onEdit={() => navigate(`/aplicacoes/${app.id}/editor`)}
              onResponses={() => navigate(`/aplicacoes/${app.id}/respostas`)}
              onShare={handleShare} onDuplicate={() => onDuplicate(app.id)}
              onDelete={() => onDelete(app.id)} onOpenChange={setMenuOpen}
            />
          </motion.div>
        </div>
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 mt-2 mb-1">
          {app.title}
        </h3>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[12px] text-[var(--text-tertiary)]">{date}</span>
          <span className={cn('text-[12px] font-medium', app.response_count > 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]')}>
            {app.response_count > 0 ? `${app.response_count.toLocaleString('pt-BR')} resposta${app.response_count !== 1 ? 's' : ''}` : 'Sem respostas'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
