import { useState } from 'react';
import { formatDate, ICON_BTN_STYLE } from '../../utils/respostas.helpers';

interface RespostasDetailHeaderProps {
  responseId: string;
  submittedAt: string;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDelete: (id: string) => void;
}

export function RespostasDetailHeader({
  responseId,
  submittedAt,
  index,
  total,
  onPrev,
  onNext,
  onDelete,
}: RespostasDetailHeaderProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(responseId);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          Data de in\u00edcio: {formatDate(submittedAt)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
          Identificador: {responseId}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button title="Copiar link desta resposta" onClick={() => navigator.clipboard.writeText(window.location.href + '?r=' + responseId)} style={ICON_BTN_STYLE}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
        <button title="Imprimir resposta" onClick={() => window.print()} style={ICON_BTN_STYLE}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        </button>
        <button
          title={confirmDelete ? 'Clique novamente para confirmar' : 'Apagar resposta'}
          onClick={handleDeleteClick}
          style={{
            ...ICON_BTN_STYLE,
            color: confirmDelete ? '#ef4444' : 'var(--text-tertiary)',
            background: confirmDelete ? 'rgba(239,68,68,0.08)' : 'transparent',
            borderColor: confirmDelete ? 'rgba(239,68,68,0.3)' : 'var(--border-hairline)',
            fontWeight: confirmDelete ? 600 : 400,
            fontSize: confirmDelete ? 11 : undefined,
            padding: confirmDelete ? '4px 8px' : '6px',
            gap: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {confirmDelete ? 'Confirmar?' : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          )}
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border-hairline)', margin: '0 4px' }} />
        <button onClick={onPrev} disabled={index === 0} title="Resposta anterior" style={{ ...ICON_BTN_STYLE, opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? 'not-allowed' : 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button onClick={onNext} disabled={index === total - 1} title="Pr\u00f3xima resposta" style={{ ...ICON_BTN_STYLE, opacity: index === total - 1 ? 0.3 : 1, cursor: index === total - 1 ? 'not-allowed' : 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
}
