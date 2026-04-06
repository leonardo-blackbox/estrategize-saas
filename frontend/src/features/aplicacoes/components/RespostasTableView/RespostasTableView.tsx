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
                  const displayValue = answer ? resolveValue(answer, fields) : '\u2014';
                  const isPhone = f.type === 'phone';
                  const waHref = isPhone && answer ? (() => {
                    const digits = String(answer.value).replace(/\D/g, '');
                    const normalized = digits.startsWith('55') ? digits : `55${digits}`;
                    return `https://wa.me/${normalized}`;
                  })() : null;
                  return (
                    <td key={f.id} style={{ padding: '10px 12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-hairline)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {waHref && displayValue !== '\u2014' ? (
                        <a href={waHref} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#25D366', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Abrir WhatsApp">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          {displayValue}
                        </a>
                      ) : displayValue}
                    </td>
                  );
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
