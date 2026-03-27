import { useState } from 'react';
import type { ResponseWithAnswers, ApplicationField } from '../../services/aplicacoes.api';
import { formatDate, resolveValue, getCollectibleFields, UTM_KEYS, UTM_COLORS } from '../../utils/respostas.helpers';

interface RespostasTableViewProps {
  responses: ResponseWithAnswers[];
  fields: ApplicationField[];
  showUTMColumns: boolean;
  onDelete: (id: string) => void;
}

const TH: React.CSSProperties = {
  padding: '9px 12px', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600,
  fontSize: 11, letterSpacing: '0.04em', borderBottom: '1px solid var(--border-hairline)',
  whiteSpace: 'nowrap', background: 'var(--bg-surface-1)', position: 'sticky', top: 0, zIndex: 1,
};

export function RespostasTableView({ responses, fields, showUTMColumns, onDelete }: RespostasTableViewProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const collectibleFields = getCollectibleFields(fields);

  if (responses.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 64, gap: 12 }}>
        <div style={{ fontSize: 40, opacity: 0.2 }}>📋</div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>Nenhuma resposta ainda.</p>
      </div>
    );
  }

  function handleDelete(id: string) {
    if (confirmId === id) { onDelete(id); setConfirmId(null); }
    else { setConfirmId(id); setTimeout(() => setConfirmId((c) => (c === id ? null : c)), 3000); }
  }

  return (
    <div style={{ overflowX: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ ...TH, width: 40 }}>#</th>
            <th style={{ ...TH, width: 130 }}>Data</th>
            {collectibleFields.map((f) => (
              <th key={f.id} style={{ ...TH, maxWidth: 200 }}>{f.title.length > 32 ? f.title.slice(0, 32) + '\u2026' : f.title}</th>
            ))}
            {showUTMColumns && UTM_KEYS.slice(0, 3).map((k) => (
              <th key={k} style={TH}>
                <span style={{ color: UTM_COLORS[k], fontSize: 10, fontWeight: 700, background: `${UTM_COLORS[k]}15`, padding: '2px 6px', borderRadius: 4 }}>{k}</span>
              </th>
            ))}
            <th style={{ ...TH, width: 48, textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {responses.map((r, idx) => {
            const isConfirm = confirmId === r.id;
            return (
              <tr key={r.id} style={{ transition: 'background 0.1s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <td style={{ padding: '10px 12px', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-hairline)', fontSize: 12, fontFamily: 'monospace' }}>{idx + 1}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-hairline)', whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(r.submitted_at || r.created_at)}</td>
                {collectibleFields.map((f) => {
                  const answer = r.answers.find((a) => a.field_id === f.id);
                  return <td key={f.id} style={{ padding: '10px 12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-hairline)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{answer ? resolveValue(answer, fields) : '\u2014'}</td>;
                })}
                {showUTMColumns && UTM_KEYS.slice(0, 3).map((k) => (
                  <td key={k} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {r.metadata?.[k] ? <span style={{ color: UTM_COLORS[k], background: `${UTM_COLORS[k]}12`, padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{r.metadata[k]}</span> : <span style={{ color: 'var(--text-tertiary)' }}>{'\u2014'}</span>}
                  </td>
                ))}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)', textAlign: 'center' }}>
                  <button onClick={() => handleDelete(r.id)} title={isConfirm ? 'Clique para confirmar' : 'Apagar resposta'}
                    style={{ background: isConfirm ? 'rgba(239,68,68,0.08)' : 'transparent', border: `1px solid ${isConfirm ? 'rgba(239,68,68,0.3)' : 'transparent'}`, borderRadius: 5, color: isConfirm ? '#ef4444' : 'var(--text-tertiary)', cursor: 'pointer', padding: '3px 7px', fontSize: 11, fontWeight: isConfirm ? 600 : 400, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {isConfirm ? '\u2713 OK?' : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
