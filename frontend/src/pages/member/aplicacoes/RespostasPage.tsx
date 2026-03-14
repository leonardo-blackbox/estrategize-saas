import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';
import {
  fetchApplication,
  fetchResponses,
  exportResponses,
  applicationKeys,
  type ResponseWithAnswers,
  type ApplicationField,
} from '../../../api/applications.ts';

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
  const first = response.answers[0];
  return formatValue(first.value).slice(0, 48) || '—';
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  return `${diffDay}d atrás`;
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: 64,
            borderRadius: 10,
            background: 'var(--bg-hover)',
          }}
        />
      ))}
    </div>
  );
}

function MainSkeleton() {
  return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        className="animate-pulse"
        style={{ height: 28, width: 200, borderRadius: 8, background: 'var(--bg-hover)' }}
      />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            className="animate-pulse"
            style={{ height: 13, width: 120, borderRadius: 6, background: 'var(--bg-hover)' }}
          />
          <div
            className="animate-pulse"
            style={{ height: 72, borderRadius: 12, background: 'var(--bg-hover)' }}
          />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Response Sidebar Item
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
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      style={{
        width: '100%',
        textAlign: 'left',
        background: isSelected ? 'rgba(124, 92, 252, 0.08)' : 'transparent',
        border: 'none',
        borderLeft: isSelected ? '3px solid #7c5cfc' : '3px solid transparent',
        borderRadius: '0 8px 8px 0',
        padding: '10px 12px 10px 12px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isSelected ? '#7c5cfc' : 'var(--text-primary)',
          marginBottom: 3,
        }}
      >
        Resposta #{index + 1}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          marginBottom: 4,
        }}
      >
        {timeAgo(response.submitted_at || response.created_at)}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {getFirstAnswerPreview(response)}
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────
// Individual Response View
// ─────────────────────────────────────────────

function IndividualView({
  response,
  index,
  total,
  onPrev,
  onNext,
  direction,
}: {
  response: ResponseWithAnswers;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  direction: 'forward' | 'back';
}) {
  const xOffset = direction === 'forward' ? 40 : -40;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={response.id}
        initial={{ opacity: 0, x: xOffset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -xOffset }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: '32px 40px', maxWidth: 800, width: '100%' }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-tertiary)',
              marginBottom: 6,
            }}
          >
            {index + 1} de {total}
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Resposta #{index + 1}
          </h2>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
            {formatDate(response.submitted_at || response.created_at)}
          </div>
        </div>

        {/* Answers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {response.answers.length === 0 && (
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                background: 'var(--bg-surface-1)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-tertiary)',
                fontSize: 14,
              }}
            >
              Nenhuma resposta registrada.
            </div>
          )}
          {response.answers.map((answer) => (
            <div key={answer.field_id}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-tertiary)',
                  marginBottom: 8,
                }}
              >
                {answer.field_title}
              </div>
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: 'var(--bg-surface-1)',
                  border: '1px solid var(--border-hairline)',
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
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
          ))}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 40,
            paddingTop: 24,
            borderTop: '1px solid var(--border-hairline)',
          }}
        >
          <button
            onClick={onPrev}
            disabled={index === 0}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-hairline)',
              color: index === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: index === 0 ? 'not-allowed' : 'pointer',
              opacity: index === 0 ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            ← Anterior
          </button>
          <button
            onClick={onNext}
            disabled={index === total - 1}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-hairline)',
              color: index === total - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: index === total - 1 ? 'not-allowed' : 'pointer',
              opacity: index === total - 1 ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            Próxima →
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// Table View
// ─────────────────────────────────────────────

function TableView({
  responses,
  fields,
}: {
  responses: ResponseWithAnswers[];
  fields: ApplicationField[];
}) {
  const collectibleFields = fields.filter(
    (f) => f.type !== 'welcome' && f.type !== 'thank_you' && f.type !== 'message',
  );

  if (responses.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          padding: 64,
          gap: 12,
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.2 }}>📋</div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>
          Nenhuma resposta ainda.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', overflowX: 'auto', flex: 1 }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                padding: '10px 14px',
                textAlign: 'left',
                color: 'var(--text-tertiary)',
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderBottom: '1px solid var(--border-hairline)',
                whiteSpace: 'nowrap',
              }}
            >
              #
            </th>
            <th
              style={{
                padding: '10px 14px',
                textAlign: 'left',
                color: 'var(--text-tertiary)',
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderBottom: '1px solid var(--border-hairline)',
                whiteSpace: 'nowrap',
              }}
            >
              Data
            </th>
            {collectibleFields.map((f) => (
              <th
                key={f.id}
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderBottom: '1px solid var(--border-hairline)',
                  whiteSpace: 'nowrap',
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {f.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {responses.map((response, idx) => (
            <tr
              key={response.id}
              style={{ transition: 'background 0.1s' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <td
                style={{
                  padding: '12px 14px',
                  color: 'var(--text-tertiary)',
                  borderBottom: '1px solid var(--border-hairline)',
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
              >
                {idx + 1}
              </td>
              <td
                style={{
                  padding: '12px 14px',
                  color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-hairline)',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                }}
              >
                {formatDate(response.submitted_at || response.created_at)}
              </td>
              {collectibleFields.map((f) => {
                const answer = response.answers.find((a) => a.field_id === f.id);
                return (
                  <td
                    key={f.id}
                    style={{
                      padding: '12px 14px',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-hairline)',
                      maxWidth: 240,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {answer ? formatValue(answer.value) : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: 64,
        gap: 16,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, opacity: 0.15 }}>📬</div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        Nenhuma resposta ainda.
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0, maxWidth: 340 }}>
        Compartilhe o link do formulário para começar a coletar respostas.
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderRadius: 10,
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-hairline)',
          maxWidth: 440,
          width: '100%',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}
        >
          {publicUrl}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(publicUrl)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#7c5cfc',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
          }}
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
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward');
  const [isExporting, setIsExporting] = useState(false);

  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: applicationKeys.detail(id!),
    queryFn: () => fetchApplication(id!),
    enabled: Boolean(id),
  });

  const { data: responsesData, isLoading: responsesLoading } = useQuery({
    queryKey: applicationKeys.responses(id!),
    queryFn: () => fetchResponses(id!, 1, 100),
    enabled: Boolean(id),
  });

  const responses: ResponseWithAnswers[] = responsesData?.data ?? [];
  const fields = application?.fields ?? [];
  const collectibleFields = fields.filter(
    (f) => f.type !== 'welcome' && f.type !== 'thank_you' && f.type !== 'message',
  );

  const selectedResponse = responses[selectedIndex] ?? null;

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
    if (selectedIndex >= responses.length - 1) return;
    setNavDirection('forward');
    setSelectedIndex((prev) => prev + 1);
  }, [selectedIndex, responses.length]);

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

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ── Topbar ── */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          borderBottom: '1px solid var(--border-hairline)',
          background: 'var(--bg-surface-1)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <Link
          to="/aplicacoes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)';
          }}
        >
          ← Aplicações
        </Link>

        <div
          style={{
            width: 1,
            height: 16,
            background: 'var(--border-hairline)',
            flexShrink: 0,
          }}
        />

        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {appLoading ? '...' : (application?.title ?? 'Respostas')}
        </span>

        {/* View toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 8,
            padding: 2,
            gap: 2,
          }}
        >
          {(['individual', 'tabela'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === mode ? 'var(--bg-surface-1)' : 'transparent',
                color: viewMode === mode ? 'var(--text-primary)' : 'var(--text-tertiary)',
                transition: 'background 0.15s, color 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={isExporting || responses.length === 0}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            background: 'transparent',
            border: '1px solid var(--border-hairline)',
            color: responses.length === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
            cursor: responses.length === 0 ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.6 : 1,
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (responses.length > 0) {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-tertiary)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hairline)';
          }}
        >
          {isExporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <motion.div
          animate={{ width: sidebarCollapsed ? 0 : 240 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            flexShrink: 0,
            borderRight: '1px solid var(--border-hairline)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface-1)',
          }}
        >
          <div style={{ width: 240, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Sidebar header */}
            <div
              style={{
                padding: '14px 16px 10px',
                borderBottom: '1px solid var(--border-hairline)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {isLoading
                  ? '...'
                  : `${responses.length} resposta${responses.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Response list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {isLoading ? (
                <SidebarSkeleton />
              ) : responses.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    fontSize: 13,
                    color: 'var(--text-tertiary)',
                    textAlign: 'center',
                  }}
                >
                  Nenhuma resposta
                </div>
              ) : (
                responses.map((response, idx) => (
                  <ResponseSidebarItem
                    key={response.id}
                    response={response}
                    index={idx}
                    isSelected={selectedIndex === idx && viewMode === 'individual'}
                    onClick={() => {
                      setViewMode('individual');
                      handleSelectResponse(idx);
                    }}
                  />
                ))
              )}
            </div>
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
              total={responses.length}
              onPrev={handlePrev}
              onNext={handleNext}
              direction={navDirection}
            />
          ) : viewMode === 'tabela' ? (
            <TableView responses={responses} fields={fields} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
