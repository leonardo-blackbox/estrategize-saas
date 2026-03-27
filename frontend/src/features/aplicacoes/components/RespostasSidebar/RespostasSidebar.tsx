import { motion } from 'framer-motion';
import type { ResponseWithAnswers } from '../../services/aplicacoes.api';
import { getFirstAnswerPreview, timeAgo } from '../../utils/respostas.helpers';
import { SidebarSkeleton } from '../RespostasSkeletons';

interface SidebarItemProps {
  response: ResponseWithAnswers;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function SidebarItem({ response, index, isSelected, onClick }: SidebarItemProps) {
  const preview = getFirstAnswerPreview(response);
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: isSelected ? 'rgba(124,92,252,0.08)' : 'transparent',
        border: 'none',
        borderLeft: isSelected ? '3px solid #7c5cfc' : '3px solid transparent',
        padding: '10px 14px 10px 13px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: isSelected ? '#7c5cfc' : 'var(--text-primary)',
          }}
        >
          {index + 1}. {preview}
        </span>
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
        {timeAgo(response.submitted_at || response.created_at)}
      </span>
    </button>
  );
}

interface RespostasSidebarProps {
  responses: ResponseWithAnswers[];
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
        <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-hairline)' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {isLoading
              ? '\u2026'
              : `${responses.length} resposta${responses.length !== 1 ? 's' : ''}`}
          </span>
        </div>
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
              onClick={() => onSelect(idx)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
