import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../lib/cn.ts';
import { staggerContainer, staggerItem } from '../../../lib/motion.ts';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import {
  fetchApplications,
  createApplication,
  deleteApplication,
  duplicateApplication,
  applicationKeys,
  type Application,
} from '../../../api/applications.ts';

// ─────────────────────────────────────────────
// SkeletonCard
// ─────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] overflow-hidden',
        'bg-[var(--bg-surface-1)]',
        'ring-1 ring-[var(--border-hairline)]',
        'animate-pulse',
      )}
    >
      {/* Thumbnail area */}
      <div className="h-40 bg-[var(--bg-surface-2)]" />

      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Status badge */}
        <div className="h-5 w-20 rounded-full bg-[var(--bg-surface-3)]" />
        {/* Title */}
        <div className="h-4 w-3/4 rounded bg-[var(--bg-surface-3)]" />
        {/* Meta */}
        <div className="h-3 w-1/2 rounded bg-[var(--bg-surface-2)]" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────

interface EmptyStateProps {
  onCreateClick: () => void;
}

function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      {/* Icon */}
      <div
        className={cn(
          'w-20 h-20 rounded-2xl mb-6 flex items-center justify-center',
          'bg-[var(--bg-surface-1)] ring-1 ring-[var(--border-hairline)]',
        )}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="6"
            y="4"
            width="24"
            height="28"
            rx="3"
            stroke="var(--text-tertiary)"
            strokeWidth="1.5"
            fill="none"
          />
          <line
            x1="11"
            y1="12"
            x2="25"
            y2="12"
            stroke="var(--text-tertiary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="11"
            y1="17"
            x2="25"
            y2="17"
            stroke="var(--text-tertiary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="11"
            y1="22"
            x2="20"
            y2="22"
            stroke="var(--text-tertiary)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="26" cy="26" r="5" fill="#7c5cfc" />
          <line
            x1="26"
            y1="23"
            x2="26"
            y2="29"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="23"
            y1="26"
            x2="29"
            y2="26"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">
        Nenhuma aplicação ainda
      </h3>
      <p className="text-[14px] text-[var(--text-secondary)] max-w-sm leading-relaxed mb-8">
        Crie seu primeiro formulário e comece a coletar respostas em minutos.
      </p>

      <Button
        onClick={onCreateClick}
        className="gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Criar primeira aplicação
      </Button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────

interface StatusBadgeProps {
  status: Application['status'];
}

const STATUS_CONFIG: Record<
  Application['status'],
  { dot: string; label: string }
> = {
  published: { dot: 'bg-green-500', label: 'Publicado' },
  draft: { dot: 'bg-amber-400', label: 'Rascunho' },
  archived: { dot: 'bg-[var(--text-tertiary)]', label: 'Arquivado' },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-1 rounded-full',
        'text-[11px] font-medium',
        'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
        'ring-1 ring-[var(--border-hairline)]',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}

// ─────────────────────────────────────────────
// FormThumbnail
// ─────────────────────────────────────────────

interface FormThumbnailProps {
  form: Application;
}

function FormThumbnail({ form }: FormThumbnailProps) {
  const bg = form.theme_config?.backgroundColor ?? '#000000';
  const btn = form.theme_config?.buttonColor ?? '#7c5cfc';
  const question = form.theme_config?.questionColor ?? '#f5f5f7';

  return (
    <div
      className="h-40 overflow-hidden relative select-none"
      style={{ backgroundColor: bg }}
    >
      {/* Background image overlay */}
      {form.theme_config?.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${form.theme_config.backgroundImageUrl})` }}
        />
      )}

      {/* Mini form content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-center gap-2" style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '143%' }}>
        {/* Question lines */}
        <div
          className="h-3 rounded-sm w-4/5"
          style={{ backgroundColor: question, opacity: 0.9 }}
        />
        <div
          className="h-2.5 rounded-sm w-2/3"
          style={{ backgroundColor: question, opacity: 0.5 }}
        />
        <div
          className="h-2 rounded-sm w-1/2 mt-1"
          style={{ backgroundColor: question, opacity: 0.25 }}
        />

        {/* Answer input mock */}
        <div
          className="mt-3 h-8 rounded-lg w-full"
          style={{
            backgroundColor: question,
            opacity: 0.08,
            border: `1px solid ${question}30`,
          }}
        />

        {/* Button mock */}
        <div
          className="mt-2 h-8 rounded-lg w-28 flex items-center justify-center"
          style={{
            backgroundColor: btn,
            borderRadius: `${form.theme_config?.borderRadius ?? 12}px`,
          }}
        >
          <div className="h-2 w-10 rounded-sm bg-white opacity-70" />
        </div>
      </div>

      {/* Subtle gradient overlay at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12"
        style={{
          background: `linear-gradient(to bottom, transparent, ${bg}88)`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// KebabMenu
// ─────────────────────────────────────────────

interface KebabMenuProps {
  onEdit: () => void;
  onResponses: () => void;
  onShare: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function KebabMenu({ onEdit, onResponses, onShare, onDuplicate, onDelete }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const menuItems: Array<{
    label: string;
    onClick: () => void;
    danger?: boolean;
    icon: React.ReactNode;
  }> = [
    {
      label: 'Editar',
      onClick: onEdit,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      ),
    },
    {
      label: 'Ver Respostas',
      onClick: onResponses,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7z"
            stroke="currentColor"
            strokeWidth="1.3"
            fill="none"
          />
          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
        </svg>
      ),
    },
    {
      label: 'Compartilhar',
      onClick: onShare,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M10 1l3 3-3 3M13 4H5a3 3 0 000 6h1"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: 'Duplicar',
      onClick: onDuplicate,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect
            x="4"
            y="4"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.3"
            fill="none"
          />
          <path
            d="M2 10V2h8"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: 'Excluir',
      onClick: onDelete,
      danger: true,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5h6.6L11 4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          'hover:bg-[var(--bg-hover)]',
          'transition-colors duration-150',
        )}
        aria-label="Mais opções"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.2" />
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="8" cy="13" r="1.2" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute right-0 top-10 z-50 w-44',
              'rounded-[var(--radius-md)] overflow-hidden',
              'bg-[var(--bg-surface-2)]',
              'ring-1 ring-[var(--border-subtle)]',
              'shadow-[var(--shadow-elev)]',
              'py-1',
            )}
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-2',
                  'text-[13px] font-medium text-left',
                  'transition-colors duration-100',
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                )}
              >
                <span className={item.danger ? 'text-red-400' : 'text-[var(--text-tertiary)]'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// ApplicationCard
// ─────────────────────────────────────────────

interface ApplicationCardProps {
  app: Application;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function ApplicationCard({ app, onDuplicate, onDelete }: ApplicationCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const formattedDate = new Date(app.updated_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/f/${app.slug}`;
    navigator.clipboard.writeText(url).catch(() => null);
  };

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => navigate(`/aplicacoes/${app.id}/editor`)}
      className={cn(
        'group rounded-[var(--radius-md)] overflow-hidden cursor-pointer',
        'bg-[var(--bg-surface-1)]',
        'ring-1 transition-all duration-200',
        isHovered
          ? 'ring-[#7c5cfc66] shadow-[0_8px_32px_rgba(124,92,252,0.12)]'
          : 'ring-[var(--border-hairline)] shadow-none',
      )}
    >
      {/* Thumbnail */}
      <FormThumbnail form={app} />

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <StatusBadge status={app.status} />

          {/* Kebab menu — shown when card hovered */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <KebabMenu
                  onEdit={() => navigate(`/aplicacoes/${app.id}/editor`)}
                  onResponses={() => navigate(`/aplicacoes/${app.id}/respostas`)}
                  onShare={handleCopyLink}
                  onDuplicate={() => onDuplicate(app.id)}
                  onDelete={() => onDelete(app.id)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] leading-snug line-clamp-2 mt-2 mb-1">
          {app.title}
        </h3>

        <div className="flex items-center justify-between mt-3">
          <span className="text-[12px] text-[var(--text-tertiary)]">
            {formattedDate}
          </span>
          <span
            className={cn(
              'text-[12px] font-medium',
              app.response_count > 0
                ? 'text-[var(--text-secondary)]'
                : 'text-[var(--text-tertiary)]',
            )}
          >
            {app.response_count > 0
              ? `${app.response_count.toLocaleString('pt-BR')} resposta${app.response_count !== 1 ? 's' : ''}`
              : 'Sem respostas'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// DeleteConfirmModal
// ─────────────────────────────────────────────

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteConfirmModal({ open, onClose, onConfirm, isLoading }: DeleteConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">
            Excluir aplicação
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            Esta ação é permanente. Todas as respostas coletadas também serão removidas. Tem certeza?
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isLoading ? 'Excluindo…' : 'Excluir'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// CreateModal
// ─────────────────────────────────────────────

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateModal({ open, onClose }: CreateModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => createApplication(title.trim()),
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      onClose();
      setTitle('');
      navigate(`/aplicacoes/${app.id}/editor`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length === 0) return;
    mutate();
  };

  const handleClose = () => {
    if (isPending) return;
    setTitle('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">
            Nova aplicação
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Dê um nome para identificar seu formulário.
          </p>
        </div>

        <Input
          label="Nome da aplicação"
          placeholder="Ex: Formulário de Diagnóstico"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 200))}
          maxLength={200}
          autoFocus
          disabled={isPending}
        />

        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--text-tertiary)]">
            {title.length}/200
          </span>
          {error && (
            <span className="text-[12px] text-red-400">
              {(error as Error).message ?? 'Erro ao criar'}
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending || title.trim().length === 0}
          >
            {isPending ? 'Criando…' : 'Criar Aplicação'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// AplicacoesPage (main)
// ─────────────────────────────────────────────

type FilterTab = 'all' | 'published' | 'draft';

const FILTER_TABS: Array<{ id: FilterTab; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'published', label: 'Publicados' },
  { id: 'draft', label: 'Rascunhos' },
];

export default function AplicacoesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  // ── Queries ──────────────────────────────────

  const {
    data: applications = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: applicationKeys.lists(),
    queryFn: fetchApplications,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      setDeleteTarget(null);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
    },
  });

  // ── Filtering ─────────────────────────────────

  const filtered = applications.filter((app) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'published' && app.status === 'published') ||
      (activeFilter === 'draft' && app.status === 'draft');

    const matchesSearch =
      search.trim() === '' ||
      app.title.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] mb-3">
              <Link
                to="/ferramentas"
                className="hover:text-[var(--text-secondary)] transition-colors"
              >
                ← Ferramentas
              </Link>
              <span className="opacity-40">·</span>
              <span className="text-[var(--text-secondary)]">Aplicações</span>
            </nav>

            <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
              Aplicações
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)] mt-1">
              Formulários inteligentes para coletar dados dos seus clientes.
            </p>
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            className="flex-shrink-0 gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M7 1v12M1 7h12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Nova Aplicação
          </Button>
        </div>

        {/* Toolbar: Filter tabs + Search */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Filter tabs */}
          <div
            className={cn(
              'flex items-center gap-1 p-1 rounded-[var(--radius-md)]',
              'bg-[var(--bg-surface-1)] ring-1 ring-[var(--border-hairline)]',
            )}
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-[calc(var(--radius-md)-4px)]',
                  'text-[13px] font-medium transition-all duration-150',
                  activeFilter === tab.id
                    ? 'bg-[var(--bg-surface-3)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
                )}
              >
                {tab.label}
                {tab.id !== 'all' && (
                  <span className="ml-1.5 text-[11px] text-[var(--text-tertiary)]">
                    {applications.filter((a) =>
                      tab.id === 'published'
                        ? a.status === 'published'
                        : a.status === 'draft',
                    ).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Buscar aplicação…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full pl-9 pr-4 py-2 text-[13px]',
                'rounded-[var(--radius-md)]',
                'bg-[var(--bg-surface-1)] text-[var(--text-primary)]',
                'placeholder:text-[var(--text-tertiary)]',
                'ring-1 ring-[var(--border-hairline)]',
                'focus:ring-[var(--accent)] focus:outline-none',
                'transition-shadow duration-150',
              )}
            />
          </div>
        </div>

        {/* Content */}
        {isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-[var(--text-tertiary)] mb-3">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 9v8M16 21v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-[var(--text-primary)]">
              Erro ao carregar aplicações
            </p>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-1">
              {(error as Error)?.message ?? 'Tente novamente mais tarde.'}
            </p>
          </div>
        ) : isLoading ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 && applications.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[14px] text-[var(--text-secondary)]">
              Nenhuma aplicação encontrada para "{search || activeFilter}".
            </p>
            <button
              onClick={() => { setSearch(''); setActiveFilter('all'); }}
              className="mt-2 text-[13px] text-[var(--accent)] hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onDuplicate={(id) => duplicateMutation.mutate(id)}
                onDelete={(id) => setDeleteTarget(id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
