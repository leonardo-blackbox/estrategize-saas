import type { ResponseWithAnswers } from '../../../services/aplicacoes.api';
import { getFirstAnswerPreview, timeAgo } from '../../../utils/respostas.helpers';

interface SidebarItemProps {
  response: ResponseWithAnswers;
  index: number;
  isSelected: boolean;
  isComplete: boolean;
  onClick: () => void;
}

export function SidebarItem({ response, index, isSelected, isComplete, onClick }: SidebarItemProps) {
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
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {index + 1}. {preview}
        </span>
        <span
          style={{
            flexShrink: 0,
            fontSize: 9,
            fontWeight: 600,
            padding: '2px 5px',
            borderRadius: 4,
            background: isComplete ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
            color: isComplete ? '#10b981' : '#f59e0b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {isComplete ? '\u2713' : '\u2026'}
        </span>
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
        {timeAgo(response.submitted_at || response.created_at)}
      </span>
    </button>
  );
}
