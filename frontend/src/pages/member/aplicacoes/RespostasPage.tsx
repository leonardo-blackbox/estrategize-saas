import { useState, useCallback, useMemo } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { cn } from '../../../lib/cn.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import {
  fetchApplication,
  fetchResponses,
  exportResponses,
  deleteResponse,
  applicationKeys,
  type ResponseWithAnswers,
  type ApplicationField,
} from '../../../api/applications.ts';
import type { ApplicationShellContext } from './ApplicationShell.tsx';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function getFirstAnswerPreview(response: ResponseWithAnswers): string {
  if (!response.answers || response.answers.length === 0) return 'Sem respostas';
  const first = response.answers.find(
    (a) => a.field_type !== 'welcome' && a.field_type !== 'thank_you' && a.field_type !== 'message',
  );
  return formatValue(first?.value ?? response.answers[0]?.value).slice(0, 40) || '—';
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}m atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  return `${diffDay}d atrás`;
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
const UTM_COLORS: Record<string, string> = {
  utm_source: '#7c5cfc',
  utm_medium: '#0ea5e9',
  utm_campaign: '#10b981',
  utm_term: '#f59e0b',
  utm_content: '#ec4899',
};

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height: 48, margin: '1px 0', background: 'var(--bg-hover)' }}
        />
      ))}
    </div>
  );
}

function MainSkeleton() {
  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="animate-pulse" style={{ height: 20, width: 260, borderRadius: 6, background: 'var(--bg-hover)' }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="animate-pulse" style={{ height: 13, width: 180, borderRadius: 4, background: 'var(--bg-hover)' }} />
          <div className="animate-pulse" style={{ height: 19, width: '70%', borderRadius: 4, background: 'var(--bg-hover)' }} />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Sidebar Item
// ─────────────────────────────────────────────

function ResponseSidebarItem({
  response,
  index,
  isSelected,
  onClick,
}: {
  response: ResponseWithAnswers;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
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

// ─────────────────────────────────────────────
// Individual Response View — Respondi style
// ─────────────────────────────────────────────

function IndividualView({
  response,
  index,
  total,
  onPrev,
  onNext,
  onDelete,
  direction,
  showUTM,
}: {
  response: ResponseWithAnswers;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDelete: (id: string) => void;
  direction: 'forward' | 'back';
  showUTM: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const xOffset = direction === 'forward' ? 32 : -32;

  const utmEntries = UTM_KEYS.filter(
    (k) => response.metadata?.[k] && response.metadata[k] !== '',
  );

  const displayAnswers = response.answers.filter(
    (a) => a.field_type !== 'welcome' && a.field_type !== 'thank_you' && a.field_type !== 'message',
  );

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(response.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={response.id}
        initial={{ opacity: 0, x: xOffset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -xOffset }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: '20px 32px 40px', maxWidth: 760, width: '100%' }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 28,
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Data de início: {formatDate(response.submitted_at || response.created_at)}
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                fontFamily: 'monospace',
                letterSpacing: '0.02em',
              }}
            >
              Identificador: {response.id}
            </span>
          </div>

          {/* Action icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {/* Copy link */}
            <button
              title="Copiar link desta resposta"
              onClick={() => navigator.clipboard.writeText(window.location.href + '?r=' + response.id)}
              style={iconBtnStyle}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            {/* Print */}
            <button
              title="Imprimir resposta"
              onClick={() => window.print()}
              style={iconBtnStyle}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>
            {/* Delete */}
            <button
              title={confirmDelete ? 'Clique novamente para confirmar' : 'Apagar resposta'}
              onClick={handleDeleteClick}
              style={{
                ...iconBtnStyle,
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
              {confirmDelete ? (
                'Confirmar?'
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              )}
            </button>
            {/* Separator */}
            <div style={{ width: 1, height: 20, background: 'var(--border-hairline)', margin: '0 4px' }} />
            {/* Prev */}
            <button
              onClick={onPrev}
              disabled={index === 0}
              title="Resposta anterior"
              style={{ ...iconBtnStyle, opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? 'not-allowed' : 'pointer' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {/* Next */}
            <button
              onClick={onNext}
              disabled={index === total - 1}
              title="Próxima resposta"
              style={{ ...iconBtnStyle, opacity: index === total - 1 ? 0.3 : 1, cursor: index === total - 1 ? 'not-allowed' : 'pointer' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── UTM Tags ── */}
        {showUTM && utmEntries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {utmEntries.map((k) => (
              <span
                key={k}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 9px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: `${UTM_COLORS[k]}15`,
                  border: `1px solid ${UTM_COLORS[k]}30`,
                  color: UTM_COLORS[k],
                  letterSpacing: '0.02em',
                }}
              >
                <span style={{ opacity: 0.6, fontWeight: 400 }}>
                  {k.replace('utm_', '')}
                </span>
                {response.metadata[k]}
              </span>
            ))}
          </div>
        )}

        {/* ── Answers ── */}
        {displayAnswers.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            Nenhuma resposta registrada.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayAnswers.map((answer, i) => (
              <div key={answer.field_id}>
                <div style={{ padding: '16px 0' }}>
                  {/* Question */}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#7c5cfc',
                      marginBottom: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    {answer.field_title}
                  </div>
                  {/* Answer */}
                  <div
                    style={{
                      fontSize: 15,
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                    }}
                  >
                    {formatValue(answer.value) || (
                      <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        Sem resposta
                      </span>
                    )}
                  </div>
                </div>
                {i < displayAnswers.length - 1 && (
                  <div style={{ height: 1, background: 'var(--border-hairline)' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  borderRadius: 6,
  background: 'transparent',
  border: '1px solid var(--border-hairline)',
  color: 'var(--text-tertiary)',
  cursor: 'pointer',
  transition: 'color 0.12s, background 0.12s',
  padding: 6,
};

// ─────────────────────────────────────────────
// Table View
// ─────────────────────────────────────────────

function TableView({
  responses,
  fields,
  showUTMColumns,
  onDelete,
}: {
  responses: ResponseWithAnswers[];
  fields: ApplicationField[];
  showUTMColumns: boolean;
  onDelete: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const collectibleFields = fields.filter(
    (f) => f.type !== 'welcome' && f.type !== 'thank_you' && f.type !== 'message',
  );

  if (responses.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 64, gap: 12 }}>
        <div style={{ fontSize: 40, opacity: 0.2 }}>📋</div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>Nenhuma resposta ainda.</p>
      </div>
    );
  }

  function handleDelete(id: string) {
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId((c) => (c === id ? null : c)), 3000);
    }
  }

  const thStyle: React.CSSProperties = {
    padding: '9px 12px',
    textAlign: 'left',
    color: 'var(--text-tertiary)',
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--border-hairline)',
    whiteSpace: 'nowrap',
    background: 'var(--bg-surface-1)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  return (
    <div style={{ overflowX: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 40 }}>#</th>
            <th style={{ ...thStyle, width: 130 }}>Data</th>
            {collectibleFields.map((f) => (
              <th key={f.id} style={{ ...thStyle, maxWidth: 200 }}>
                {f.title.length > 32 ? f.title.slice(0, 32) + '…' : f.title}
              </th>
            ))}
            {showUTMColumns &&
              UTM_KEYS.slice(0, 3).map((k) => (
                <th key={k} style={{ ...thStyle }}>
                  <span
                    style={{
                      color: UTM_COLORS[k],
                      fontSize: 10,
                      fontWeight: 700,
                      background: `${UTM_COLORS[k]}15`,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {k}
                  </span>
                </th>
              ))}
            <th style={{ ...thStyle, width: 48, textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {responses.map((response, idx) => {
            const isConfirm = confirmId === response.id;
            return (
              <tr
                key={response.id}
                style={{ transition: 'background 0.1s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <td style={{ padding: '10px 12px', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-hairline)', fontSize: 12, fontFamily: 'monospace' }}>
                  {idx + 1}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-hairline)', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {formatDate(response.submitted_at || response.created_at)}
                </td>
                {collectibleFields.map((f) => {
                  const answer = response.answers.find((a) => a.field_id === f.id);
                  return (
                    <td
                      key={f.id}
                      style={{ padding: '10px 12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-hairline)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {answer ? formatValue(answer.value) : '—'}
                    </td>
                  );
                })}
                {showUTMColumns &&
                  UTM_KEYS.slice(0, 3).map((k) => (
                    <td key={k} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {response.metadata?.[k] ? (
                        <span
                          style={{
                            color: UTM_COLORS[k],
                            background: `${UTM_COLORS[k]}12`,
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {response.metadata[k]}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>
                  ))}
                {/* Delete */}
                <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-hairline)', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(response.id)}
                    title={isConfirm ? 'Clique para confirmar' : 'Apagar resposta'}
                    style={{
                      background: isConfirm ? 'rgba(239,68,68,0.08)' : 'transparent',
                      border: `1px solid ${isConfirm ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
                      borderRadius: 5,
                      color: isConfirm ? '#ef4444' : 'var(--text-tertiary)',
                      cursor: 'pointer',
                      padding: '3px 7px',
                      fontSize: 11,
                      fontWeight: isConfirm ? 600 : 400,
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    {isConfirm ? (
                      '✓ OK?'
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    )}
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

// ─────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────

function EmptyState({ slug }: { slug: string }) {
  const publicUrl = `${window.location.origin}/f/${slug}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 64, gap: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 48, opacity: 0.15 }}>📬</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
        Nenhuma resposta ainda.
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0, maxWidth: 340 }}>
        Compartilhe o link do formulário para começar a coletar respostas.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)', maxWidth: 440, width: '100%' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
          {publicUrl}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(publicUrl)}
          style={{ background: 'transparent', border: 'none', color: '#7c5cfc', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
        >
          Copiar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

type ViewMode = 'individual' | 'tabela';

export default function RespostasPage() {
  const { id } = useParams<{ id: string }>();
  useOutletContext<ApplicationShellContext>();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward');
  const [isExporting, setIsExporting] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [showUTMColumns, setShowUTMColumns] = useState(false);

  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: applicationKeys.detail(id!),
    queryFn: () => fetchApplication(id!),
    enabled: Boolean(id),
  });

  const { data: responsesData, isLoading: responsesLoading } = useQuery({
    queryKey: applicationKeys.responses(id!),
    queryFn: () => fetchResponses(id!, 1, 200),
    enabled: Boolean(id),
  });

  const { mutate: deleteResponseMutation } = useMutation({
    mutationFn: (responseId: string) => deleteResponse(id!, responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.responses(id!) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id!) });
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    },
  });

  const responses: ResponseWithAnswers[] = responsesData?.data ?? [];
  const fields = application?.fields ?? [];
  const collectibleFields = fields.filter(
    (f) => f.type !== 'welcome' && f.type !== 'thank_you' && f.type !== 'message',
  );

  const filteredResponses = useMemo(() => {
    if (!responses) return [];
    if (dateFilter === 'all') return responses;
    const now = new Date();
    const since = new Date();
    if (dateFilter === 'today') {
      since.setHours(0, 0, 0, 0);
    } else if (dateFilter === '7d') {
      since.setDate(now.getDate() - 7);
    } else if (dateFilter === '30d') {
      since.setDate(now.getDate() - 30);
    }
    return responses.filter((r) => new Date(r.created_at) >= since);
  }, [responses, dateFilter]);

  const selectedResponse = filteredResponses[selectedIndex] ?? null;

  const handleSelectResponse = useCallback((idx: number) => {
    setNavDirection(idx > selectedIndex ? 'forward' : 'back');
    setSelectedIndex(idx);
  }, [selectedIndex]);

  const handlePrev = useCallback(() => {
    if (selectedIndex === 0) return;
    setNavDirection('back');
    setSelectedIndex((prev) => prev - 1);
  }, [selectedIndex]);

  const handleNext = useCallback(() => {
    if (selectedIndex >= filteredResponses.length - 1) return;
    setNavDirection('forward');
    setSelectedIndex((prev) => prev + 1);
  }, [selectedIndex, filteredResponses.length]);

  const handleExport = useCallback(async () => {
    if (!id || !application) return;
    setIsExporting(true);
    try {
      const allResponses = await exportResponses(id);
      const headers = ['#', 'Data', ...collectibleFields.map((f) => f.title)];
      const rows = allResponses.map((r, idx) => {
        const row: Record<string, string> = {
          '#': String(idx + 1),
          'Data': formatDate(r.submitted_at || r.created_at),
        };
        collectibleFields.forEach((f) => {
          const answer = r.answers.find((a) => a.field_id === f.id);
          row[f.title] = answer ? formatValue(answer.value) : '';
        });
        return row;
      });
      const csv = Papa.unparse({ fields: headers, data: rows.map((r) => headers.map((h) => r[h] ?? '')) });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respostas-${application.slug}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [id, application, collectibleFields]);

  const isLoading = appLoading || responsesLoading;
  const sidebarCollapsed = viewMode === 'tabela';
  const hasUTMData = filteredResponses.some((r) =>
    UTM_KEYS.some((k) => r.metadata?.[k]),
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', color: 'var(--text-primary)', overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-1)', flexShrink: 0, gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {isLoading ? '...' : `${filteredResponses.length} resposta${filteredResponses.length !== 1 ? 's' : ''}`}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Period filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            {(['all', 'today', '7d', '30d'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setDateFilter(f); setSelectedIndex(0); }}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer',
                  dateFilter === f
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )}
              >
                {f === 'all' ? 'Todas' : f === 'today' ? 'Hoje' : f === '7d' ? '7d' : '30d'}
              </button>
            ))}
          </div>

          {/* UTM toggle */}
          <button
            onClick={() => setShowUTMColumns((v) => !v)}
            title={hasUTMData ? 'Mostrar dados UTM' : 'Nenhum UTM registrado ainda'}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer border',
              showUTMColumns
                ? 'text-white border-[#7c5cfc]'
                : 'text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]',
            )}
            style={{
              background: showUTMColumns ? 'rgba(124,92,252,0.15)' : 'transparent',
              color: showUTMColumns ? '#7c5cfc' : undefined,
            }}
          >
            UTM
          </button>

          <div style={{ width: 1, height: 18, background: 'var(--border-hairline)' }} />

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-base)', border: '1px solid var(--border-hairline)', borderRadius: 7, padding: 2, gap: 1 }}>
            {(['individual', 'tabela'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === mode ? 'var(--bg-surface-1)' : 'transparent',
                  color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                {mode === 'individual' ? 'Individual' : 'Tabela'}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={isExporting || responses.length === 0}
            style={{
              padding: '6px 12px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              border: '1px solid var(--border-hairline)',
              color: responses.length === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              cursor: responses.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.6 : 1,
              transition: 'color 0.15s',
            }}
          >
            {isExporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <motion.div
          animate={{ width: sidebarCollapsed ? 0 : 220 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{ flexShrink: 0, borderRight: '1px solid var(--border-hairline)', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface-1)' }}
        >
          <div style={{ width: 220, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {/* Sidebar header */}
            <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-hairline)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isLoading ? '…' : `${filteredResponses.length} resposta${filteredResponses.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            {isLoading ? (
              <SidebarSkeleton />
            ) : filteredResponses.length === 0 ? (
              <div style={{ padding: '20px 14px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                Nenhuma resposta
              </div>
            ) : (
              filteredResponses.map((response, idx) => (
                <ResponseSidebarItem
                  key={response.id}
                  response={response}
                  index={idx}
                  isSelected={selectedIndex === idx && viewMode === 'individual'}
                  onClick={() => { setViewMode('individual'); handleSelectResponse(idx); }}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* ── Main Area ── */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {isLoading ? (
            <MainSkeleton />
          ) : responses.length === 0 ? (
            <EmptyState slug={application?.slug ?? ''} />
          ) : viewMode === 'individual' && selectedResponse ? (
            <IndividualView
              response={selectedResponse}
              index={selectedIndex}
              total={filteredResponses.length}
              onPrev={handlePrev}
              onNext={handleNext}
              onDelete={deleteResponseMutation}
              direction={navDirection}
              showUTM={showUTMColumns}
            />
          ) : viewMode === 'tabela' ? (
            <TableView
              responses={filteredResponses}
              fields={fields}
              showUTMColumns={showUTMColumns}
              onDelete={deleteResponseMutation}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
