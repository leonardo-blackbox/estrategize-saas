import { useState, useMemo } from 'react';
import { fmtDateTime } from '../../utils/analytics-dates';
import type { AnalyticsLead } from '../../services/analytics.api';

interface AnalyticsLeadsTableProps {
  leads: AnalyticsLead[];
}

export function AnalyticsLeadsTable({ leads }: AnalyticsLeadsTableProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.utm_source?.toLowerCase().includes(q) ||
      l.utm_campaign?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  function copyAll() {
    const header = 'Nome\tEmail\tTelefone\tInstagram\tUTM Source\tUTM Campaign\tData';
    const rows = leads.map(l => [l.name, l.email, l.phone, l.instagram, l.utm_source, l.utm_campaign, l.submitted_at].join('\t'));
    navigator.clipboard.writeText([header, ...rows].join('\n'));
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-hairline)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ background: 'var(--bg-surface-1)', borderBottom: '1px solid var(--border-hairline)' }}>
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Leads capturados</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{leads.length} {leads.length === 1 ? 'lead' : 'leads'} no período</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-[12px] outline-none"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)', color: 'var(--text-primary)', width: 130 }} />
          <button onClick={copyAll} className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' }}>
            Copiar tudo
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="py-10 text-center" style={{ background: 'var(--bg-surface-1)' }}>
          <p className="text-[13px] text-[var(--text-tertiary)]">Nenhum lead capturado no período.</p>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ background: 'var(--bg-surface-1)' }}>
          <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                {['Nome', 'Email', 'Telefone', 'Origem', 'Campanha', 'Data'].map(col => (
                  <th key={col} className="text-left px-4 py-2.5 font-medium text-[var(--text-tertiary)] text-[11px] uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <tr key={i} className="hover:bg-[var(--bg-base)] transition-colors" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                  <td className="px-4 py-3 text-[var(--text-primary)] font-medium max-w-[140px] truncate">{lead.name || <span className="text-[var(--text-tertiary)]">—</span>}</td>
                  <td className="px-4 py-3 max-w-[180px] truncate">
                    {lead.email ? <a href={`mailto:${lead.email}`} className="hover:underline" style={{ color: '#7c5cfc' }}>{lead.email}</a> : <span className="text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] font-mono">{lead.phone || <span className="text-[var(--text-tertiary)] font-sans">—</span>}</td>
                  <td className="px-4 py-3">
                    {lead.utm_source ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(124,92,252,0.15)', color: '#7c5cfc' }}>{lead.utm_source}</span> : <span className="text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-tertiary)] max-w-[120px] truncate">{lead.utm_campaign || '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-tertiary)] whitespace-nowrap">{fmtDateTime(lead.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && search && (
            <p className="text-center py-6 text-[12px] text-[var(--text-tertiary)]">Nenhum resultado para "{search}"</p>
          )}
        </div>
      )}
    </div>
  );
}
