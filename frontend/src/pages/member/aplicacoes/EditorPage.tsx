import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchApplication,
  updateApplication,
  applicationKeys,
} from '../../../api/applications.ts';
import { useEditorStore } from '../../../stores/editorStore.ts';
import { cn } from '../../../lib/cn.ts';
import { FieldsListPanel } from '../../../components/aplicacoes/editor/FieldsList.tsx';
import { LivePreviewPanel } from '../../../components/aplicacoes/editor/LivePreview.tsx';
import { FieldOptionsPanel } from '../../../components/aplicacoes/editor/FieldOptions.tsx';

// ─────────────────────────────────────────────
// InlineTitle
// ─────────────────────────────────────────────

interface InlineTitleProps {
  value: string;
  onChange: (v: string) => void;
}

function InlineTitle({ value, onChange }: InlineTitleProps) {
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
    if (trimmed && trimmed !== value) onChange(trimmed);
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
        className={cn(
          'bg-transparent outline-none border-b border-[var(--accent)]',
          'text-[var(--text-primary)] text-[14px] font-semibold',
          'min-w-[120px] max-w-[320px]',
        )}
        style={{ width: `${Math.max(draft.length, 10)}ch` }}
        maxLength={100}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Clique para editar"
      className={cn(
        'text-[var(--text-primary)] text-[14px] font-semibold',
        'hover:text-[var(--text-secondary)] transition-colors',
        'truncate max-w-[280px] text-left cursor-text',
      )}
    >
      {value || 'Sem título'}
    </button>
  );
}

// ─────────────────────────────────────────────
// SaveStatusIndicator
// ─────────────────────────────────────────────

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
          <span
            className="inline-block w-3 h-3 border-2 border-[var(--text-tertiary)] border-t-transparent rounded-full animate-spin"
          />
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
          <button
            onClick={() => void forceSave()}
            className="underline hover:no-underline"
          >
            Erro — tentar novamente ↺
          </button>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: 'draft' | 'published' | 'archived' }) {
  const labels = { draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado' };
  const colors = {
    draft: 'rgba(142,142,147,0.15)',
    published: 'rgba(48,209,88,0.15)',
    archived: 'rgba(255,69,58,0.15)',
  };
  const textColors = {
    draft: '#8e8e93',
    published: '#30d158',
    archived: '#ff453a',
  };

  return (
    <span
      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: colors[status], color: textColors[status] }}
    >
      {labels[status]}
    </span>
  );
}

// ─────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────

interface ToastProps {
  message: string;
  link?: string;
  onDismiss: () => void;
}

function Toast({ message, link, onDismiss }: ToastProps) {
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

// ─────────────────────────────────────────────
// EditorTopbar
// ─────────────────────────────────────────────

interface EditorTopbarProps {
  onPublishToggle: () => void;
  isPublishing: boolean;
  toast: { message: string; link?: string } | null;
  onDismissToast: () => void;
}

function EditorTopbar({
  onPublishToggle,
  isPublishing,
  toast,
  onDismissToast,
}: EditorTopbarProps) {
  const navigate = useNavigate();
  const { title, status, updateTitle } = useEditorStore();

  return (
    <>
      <div
        className="col-span-3 flex items-center justify-between px-4"
        style={{
          height: 56,
          background: 'var(--bg-surface-1)',
          borderBottom: '1px solid var(--border-hairline)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          gridColumn: '1 / -1',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/aplicacoes')}
            className={cn(
              'flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)]',
              'hover:text-[var(--text-primary)] transition-colors shrink-0',
            )}
          >
            ← Aplicações
          </button>
          <span className="text-[var(--border-default)] shrink-0">/</span>
          <InlineTitle value={title} onChange={updateTitle} />
        </div>

        {/* Center */}
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button
            onClick={onPublishToggle}
            disabled={isPublishing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium',
              'transition-all duration-150',
              status === 'published'
                ? 'bg-[rgba(255,69,58,0.12)] text-[#ff453a] hover:bg-[rgba(255,69,58,0.2)]'
                : 'bg-[var(--accent)] text-white hover:opacity-90',
              'disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            {isPublishing ? (
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : null}
            {status === 'published' ? 'Despublicar' : 'Publicar'}
          </button>
        </div>

        {/* Right */}
        <div className="w-[200px] flex justify-end">
          <SaveStatusIndicator />
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            link={toast.link}
            onDismiss={onDismissToast}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────
// EditorPage
// ─────────────────────────────────────────────

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { loadApplication, reset, setStatus, status } = useEditorStore();
  const [toast, setToast] = useState<{ message: string; link?: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => fetchApplication(id ?? ''),
    enabled: Boolean(id),
    staleTime: 0,
  });

  useEffect(() => {
    if (data) loadApplication(data);
  }, [data, loadApplication]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  const publishMutation = useMutation({
    mutationFn: ({
      appId,
      newStatus,
    }: {
      appId: string;
      newStatus: 'draft' | 'published';
    }) => updateApplication(appId, { status: newStatus }),
    onSuccess: (updated) => {
      setStatus(updated.status);
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });

      if (updated.status === 'published') {
        const formUrl = `${window.location.origin}/f/${updated.slug}`;
        setToast({ message: 'Formulário publicado!', link: formUrl });
      } else {
        setToast({ message: 'Formulário despublicado.' });
      }
    },
  });

  const handlePublishToggle = useCallback(() => {
    if (!id) return;
    const newStatus = status === 'published' ? 'draft' : 'published';
    publishMutation.mutate({ appId: id, newStatus });
  }, [id, status, publishMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="inline-block w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !id) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-[var(--text-secondary)] text-[14px]">
          Não foi possível carregar o formulário.
        </p>
        <a href="/aplicacoes" className="text-[var(--accent)] text-[13px] underline">
          ← Voltar para Aplicações
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 320px',
        gridTemplateRows: '56px 1fr',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Topbar spans full width */}
      <div style={{ gridColumn: '1 / -1', gridRow: '1' }}>
        <EditorTopbar
          onPublishToggle={handlePublishToggle}
          isPublishing={publishMutation.isPending}
          toast={toast}
          onDismissToast={() => setToast(null)}
        />
      </div>

      {/* Three panels in second row */}
      <div style={{ gridColumn: '1', gridRow: '2', overflow: 'hidden' }}>
        <FieldsListPanel />
      </div>
      <div style={{ gridColumn: '2', gridRow: '2', overflow: 'hidden' }}>
        <LivePreviewPanel />
      </div>
      <div style={{ gridColumn: '3', gridRow: '2', overflow: 'hidden' }}>
        <FieldOptionsPanel />
      </div>
    </div>
  );
}
