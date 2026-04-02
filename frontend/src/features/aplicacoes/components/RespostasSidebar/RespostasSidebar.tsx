import { motion } from 'framer-motion';
import type { ResponseWithAnswers } from '../../services/aplicacoes.api';
import { SidebarSkeleton } from '../RespostasSkeletons';
import { SidebarHeader } from './SidebarHeader';
import { SidebarItem } from './SidebarItem';

interface RespostasSidebarProps {
  responses: ResponseWithAnswers[];
  completedResponseIds: Set<string>;
  selectedIndex: number;
  viewMode: string;
  isLoading: boolean;
  isMobile: boolean;
  mobileShowDetail: boolean;
  sidebarCollapsed: boolean;
  onSelect: (idx: number) => void;
}

export function RespostasSidebar({
  responses,
  completedResponseIds,
  selectedIndex,
  viewMode,
  isLoading,
  isMobile,
  mobileShowDetail,
  sidebarCollapsed,
  onSelect,
}: RespostasSidebarProps) {
  return (
    <motion.div
      animate={{
        x: isMobile ? (mobileShowDetail || sidebarCollapsed ? '-100%' : '0%') : '0%',
        width: isMobile ? '100%' : (sidebarCollapsed ? 0 : 220),
      }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: isMobile ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: isMobile ? 10 : ('auto' as never),
        flexShrink: 0,
        borderRight: '1px solid var(--border-hairline)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface-1)',
      }}
    >
      <div
        style={{
          width: isMobile ? '100%' : 220,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <SidebarHeader count={responses.length} isLoading={isLoading} />

        {isLoading ? (
          <SidebarSkeleton />
        ) : responses.length === 0 ? (
          <div
            style={{
              padding: '20px 14px',
              fontSize: 13,
              color: 'var(--text-tertiary)',
              textAlign: 'center',
            }}
          >
            Nenhuma resposta
          </div>
        ) : (
          responses.map((response, idx) => (
            <SidebarItem
              key={response.id}
              response={response}
              index={idx}
              isSelected={selectedIndex === idx && viewMode === 'individual'}
              isComplete={completedResponseIds.has(response.id)}
              onClick={() => onSelect(idx)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
