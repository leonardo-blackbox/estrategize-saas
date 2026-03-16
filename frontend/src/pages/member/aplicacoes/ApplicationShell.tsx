import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  fetchApplication,
  updateApplication,
  applicationKeys,
  type Application,
} from '../../../api/applications.ts';
import { useEditorStore } from '../../../stores/editorStore.ts';
import { cn } from '../../../lib/cn.ts';

// ─── Context type exported for child pages ──────────────────────────────────
export interface ApplicationShellContext {
  application: Application | undefined;
  isLoading: boolean;
  refetch: () => void;
}

// ─── InlineTitle ─────────────────────────────────────────────────────────────
interface InlineTitleProps {
  value: string;
  onSave: (v: string) => void;
}

function InlineTitle({ value, onSave }: InlineTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="bg-transparent outline-none border-b border-[var(--accent)] text-[var(--text-primary)] text-[14px] font-semibold min-w-[120px] max-w-[320px]"
        style={{ width: `${Math.max(draft.length, 8)}ch` }}
        maxLength={200}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Clique para editar o nome"
      className="text-[var(--text-primary)] text-[14px] font-semibold hover:text-[var(--text-secondary)] transition-colors truncate max-w-[260px] text-left cursor-text"
    >
      {value || 'Sem título'}
    </button>
  );
}

// ─── SaveStatusIndicator ─────────────────────────────────────────────────────
function SaveStatusIndicator() {
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const forceSave = useEditorStore((s) => s.forceSave);

  return (
    <AnimatePresence mode="wait">
      {saveStatus === 'saving' && (
        <motion.span
          key="saving"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-[12px] text-[var(--text-tertiary)] flex items-center gap-1.5"
        >
          <span className="inline-block w-3 h-3 border-2 border-[var(--text-tertiary)] border-t-transparent rounded-full animate-spin" />
          Salvando...
        </motion.span>
      )}
      {saveStatus === 'saved' && (
        <motion.span
          key="saved"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-[12px] text-[#30d158] flex items-center gap-1"
        >
          ✓ Salvo
        </motion.span>
      )}
      {saveStatus === 'error' && (
        <motion.span
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-[12px] text-[#ff453a] flex items-center gap-1"
        >
          <button onClick={() => void forceSave()} className="underline hover:no-underline">
            Erro — tentar novamente ↺
          </button>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({
  message,
  link,
  onDismiss,
}: {
  message: string;
  link?: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-[13px] text-[var(--text-primary)]',
      )}
    >
      <span className="text-[#30d158]">✓</span>
      <span>{message}</span>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] underline underline-offset-2 hover:no-underline"
        >
          Ver formulário →
        </a>
      )}
      <button
        onClick={onDismiss}
        className="ml-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        ×
      </button>
    </motion.div>
  );
}

// ─── ApplicationShell ────────────────────────────────────────────────────────
const TABS = [
  { id: 'editor', label: 'Editor' },
  { id: 'opcoes', label: 'Opções' },
  { id: 'compartilhar', label: 'Compartilhar' },
  { id: 'respostas', label: 'Respostas' },
] as const;

export function ApplicationShell() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<{ message: string; link?: string } | null>(null);

  // ── Load application ──────────────────────────────────────────────────────
  const {
    data: application,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => fetchApplication(id ?? ''),
    enabled: Boolean(id),
    staleTime: 0,
  });

  // ── Publish mutation ──────────────────────────────────────────────────────
  const publishMutation = useMutation({
    mutationFn: ({ newStatus }: { newStatus: 'draft' | 'published' }) =>
      updateApplication(id!, { status: newStatus }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id!) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      if (updated.status === 'published') {
        const formUrl = `${window.location.origin}/f/${updated.slug}`;
        setToast({ message: 'Formulário publicado!', link: formUrl });
      } else {
        setToast({ message: 'Formulário despublicado.' });
      }
    },
  });

  // ── Title update ──────────────────────────────────────────────────────────
  const titleMutation = useMutation({
    mutationFn: (title: string) => updateApplication(id!, { title }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id!) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });

  const handlePublishToggle = useCallback(() => {
    if (!id || !application) return;
    const newStatus = application.status === 'published' ? 'draft' : 'published';
    publishMutation.mutate({ newStatus });
  }, [id, application, publishMutation]);

  // ── Active tab detection ──────────────────────────────────────────────────
  const activeTab = TABS.find((t) =>
    location.pathname.endsWith(`/${t.id}`),
  )?.id ?? 'respostas';

  const isEditorTab = activeTab === 'editor';

  const status = application?.status ?? 'draft';
  const publicUrl = application ? `${window.location.origin}/f/${application.slug}` : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ── Topbar ────────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--border-hairline)',
          background: 'var(--bg-surface-1)',
          flexShrink: 0,
          zIndex: 40,
          gap: 0,
        }}
      >
        {/* Left ── back + title */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0" style={{ minWidth: 0, maxWidth: '30%' }}>
          <button
            onClick={() => navigate('/aplicacoes')}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-md shrink-0 cursor-pointer',
              'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
              'transition-all duration-150 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            )}
            aria-label="Voltar para Aplicações"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-[var(--border-default)] shrink-0 text-[16px] opacity-40">/</span>
          {isLoading ? (
            <div className="h-4 w-32 rounded animate-pulse bg-[var(--bg-hover)]" />
          ) : (
            <InlineTitle
              value={application?.title ?? ''}
              onSave={(v) => titleMutation.mutate(v)}
            />
          )}
        </div>

        {/* Center ── tabs */}
        <nav className="flex items-end h-full gap-0.5 px-4 flex-1 justify-center">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <NavLink
                key={tab.id}
                to={`/aplicacoes/${id}/${tab.id}`}
                className={cn(
                  'relative px-3.5 h-full flex items-center gap-1.5 text-[13.5px] font-medium select-none',
                  'transition-colors duration-150 cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm',
                  // Underline indicator
                  'after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[2px]',
                  'after:rounded-full after:transition-all after:duration-200',
                  isActive
                    ? 'text-[var(--text-primary)] after:bg-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] after:bg-transparent hover:after:bg-[var(--border-hairline)]',
                )}
              >
                {tab.label}
                {tab.id === 'respostas' && application && application.response_count > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold tabular-nums',
                      isActive
                        ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                        : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]',
                    )}
                  >
                    {application.response_count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right ── actions */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: 0, maxWidth: '30%', justifyContent: 'flex-end' }}>
          {/* Save indicator — only on editor tab */}
          {isEditorTab && (
            <div className="mr-2">
              <SaveStatusIndicator />
            </div>
          )}

          {/* Ver (preview) */}
          {application && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={status !== 'published' ? 'Publique o formulário para ver a versão pública' : 'Ver formulário público'}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 h-[30px] rounded-md text-[12.5px] font-medium cursor-pointer',
                'border transition-all duration-150 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                status === 'published'
                  ? 'border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--text-tertiary)]'
                  : 'border-[var(--border-hairline)] text-[var(--text-tertiary)] opacity-60 pointer-events-none',
              )}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 7s2-4.5 6-4.5S13 7 13 7s-2 4.5-6 4.5S1 7 1 7z" stroke="currentColor" strokeWidth="1.4" fill="none" />
                <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.4" fill="none" />
              </svg>
              Ver
            </a>
          )}

          {/* Share icon */}
          {application && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl).catch(() => null);
                setToast({ message: 'Link copiado!' });
              }}
              className={cn(
                'w-[30px] h-[30px] flex items-center justify-center rounded-md cursor-pointer',
                'border border-[var(--border-hairline)] text-[var(--text-secondary)]',
                'hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--text-tertiary)]',
                'transition-all duration-150 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
              )}
              aria-label="Copiar link do formulário"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 1l4 3-4 3M13 4H5a3 3 0 000 6h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Publish/Status button */}
          {application && (
            <button
              onClick={handlePublishToggle}
              disabled={publishMutation.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-[30px] rounded-md text-[12.5px] font-semibold cursor-pointer',
                'transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                status === 'published'
                  ? 'bg-[rgba(48,209,88,0.1)] text-[#30d158] border border-[rgba(48,209,88,0.25)] hover:bg-[rgba(48,209,88,0.18)]'
                  : 'bg-[var(--accent)] text-white hover:opacity-90 shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
              )}
            >
              {publishMutation.isPending ? (
                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              ) : status === 'published' ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
              {status === 'published' ? 'Publicado' : 'Publicar'}
            </button>
          )}
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet
          context={{
            application,
            isLoading,
            refetch,
          } satisfies ApplicationShellContext}
        />
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            link={toast.link}
            onDismiss={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
