import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import {
  getHomeSettings,
  adminUpdateHomeSettings,
  adminGetFormacaoSections,
  adminCreateSection,
  adminUpdateSection,
  adminDeleteSection,
  adminUpdateSectionCourses,
  adminReorderSections,
  adminListCourses,
} from '../../api/courses.ts';

// ─── AdminHomePage ─────────────────────────────────────────────

export function AdminHomePage() {
  const qc = useQueryClient();

  // ── Settings form state ──────────────────────────────────────
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [saved, setSaved] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['home-settings'],
    queryFn: getHomeSettings,
  });

  // Populate form once loaded
  useEffect(() => {
    if (settings && !settingsLoaded) {
      setTitle(settings.title);
      setSubtitle(settings.subtitle ?? '');
      setSettingsLoaded(true);
    }
  }, [settings, settingsLoaded]);

  const saveMutation = useMutation({
    mutationFn: () =>
      adminUpdateHomeSettings({ title: title.trim() || 'Formação', subtitle: subtitle.trim() || null }),
    onSuccess: (data) => {
      qc.setQueryData(['home-settings'], data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // ── Sections state ───────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [managingSection, setManagingSection] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['admin-formacao-sections'],
    queryFn: adminGetFormacaoSections,
  });

  const sectionList = sections as any[];

  const createMutation = useMutation({
    mutationFn: (t: string) => adminCreateSection({ title: t, sort_order: sectionList.length }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] });
      setShowCreateModal(false);
      setNewSectionTitle('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminUpdateSection(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteSection(id, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] });
      setConfirmDelete(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) => adminReorderSections(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] }),
  });

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const list = [...sectionList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
    const items = list.map((s, i) => ({ id: s.id, sort_order: i }));
    reorderMutation.mutate(items);
  };

  const previewTitle = title.trim() || 'Formação';
  const previewSubtitle = subtitle.trim();

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-3xl mx-auto space-y-10"
    >
      {/* ── Personalização da Home ── */}
      <motion.div variants={staggerItem} className="space-y-6">
        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">Home</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Personalize o título e subtítulo exibidos na página inicial da área de membros.
          </p>
        </div>

        {settingsLoading ? (
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
            <div className="h-20 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5 space-y-4">
            <Input
              label="Título da página"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Formação"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Subtítulo / instrução
              </label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Bem-vindo à sua área de aprendizado..."
                rows={3}
                maxLength={300}
                className={cn(
                  'w-full resize-none rounded-[var(--radius-sm)] border bg-[var(--bg-hover)]',
                  'border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-primary)]',
                  'placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)]',
                  'transition-colors',
                )}
              />
              <p className="text-[10px] text-[var(--text-tertiary)] text-right">
                {subtitle.length}/300
              </p>
            </div>

            {/* Preview */}
            <div className="rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-base)] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
                Preview
              </p>
              <h1 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
                {previewTitle}
              </h1>
              {previewSubtitle && (
                <p className="text-[15px] text-[var(--text-secondary)] mt-2">
                  {previewSubtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !title.trim()}
              >
                {saveMutation.isPending ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar alterações'}
              </Button>
              {saved && (
                <span className="text-xs text-emerald-500 font-medium">Alterações salvas com sucesso.</span>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Divisor ── */}
      <hr className="border-[var(--border-hairline)]" />

      {/* ── Seções ── */}
      <motion.div variants={staggerItem} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Seções</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Organize as seções exibidas na área de membros.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            + Nova seção
          </Button>
        </div>

        <div className="space-y-2">
          {sectionsLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
            ))
          ) : sectionList.length === 0 ? (
            <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
              <p className="text-sm text-[var(--text-tertiary)]">Nenhuma seção criada ainda.</p>
            </div>
          ) : (
            sectionList.map((section: any, index: number) => {
              const courseCount = (section.formation_section_courses ?? []).length;
              return (
                <div
                  key={section.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border',
                    'bg-[var(--bg-surface-1)] border-[var(--border-hairline)]',
                    !section.is_active && 'opacity-50',
                  )}
                >
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0 || reorderMutation.isPending}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors p-0.5"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sectionList.length - 1 || reorderMutation.isPending}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors p-0.5"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>

                  {/* Title (inline edit) */}
                  <div className="flex-1 min-w-0">
                    {editingId === section.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="flex-1 text-sm bg-[var(--bg-hover)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--text-primary)] focus:outline-none"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateMutation.mutate({ id: section.id, data: { title: editTitle } });
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => updateMutation.mutate({ id: section.id, data: { title: editTitle } })}
                          className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(section.id); setEditTitle(section.title); }}
                        className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors text-left"
                      >
                        {section.title}
                      </button>
                    )}
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {courseCount} curso{courseCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2">
                    <StatusDropdown
                      isActive={section.is_active}
                      isOpen={openStatusDropdown === section.id}
                      isPending={updateMutation.isPending}
                      onToggle={() => setOpenStatusDropdown((prev) => prev === section.id ? null : section.id)}
                      onSelect={(active) => {
                        updateMutation.mutate({ id: section.id, data: { is_active: active } });
                        setOpenStatusDropdown(null);
                      }}
                      onClickOutside={() => setOpenStatusDropdown(null)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setManagingSection(section)}
                    >
                      Cursos
                    </Button>
                    <button
                      onClick={() => setConfirmDelete(section.id)}
                      className="text-xs text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Create section modal */}
      <Modal open={showCreateModal} onClose={() => { setShowCreateModal(false); setNewSectionTitle(''); }} className="sm:max-w-xs">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Nova seção</h2>
          <Input
            label="Nome da seção"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="Ex: Bônus, Masterclasses..."
            onKeyDown={(e) => { if (e.key === 'Enter' && newSectionTitle.trim()) createMutation.mutate(newSectionTitle.trim()); }}
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => { if (newSectionTitle.trim()) createMutation.mutate(newSectionTitle.trim()); }}
              disabled={!newSectionTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); setNewSectionTitle(''); }}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete modal */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} className="sm:max-w-xs">
        <div className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Excluir seção?</h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            Os cursos não serão deletados, apenas removidos desta seção.
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-red-500 hover:bg-red-400"
              onClick={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete); }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage courses modal */}
      {managingSection && (
        <ManageSectionCoursesModal
          key={managingSection.id + '-' + (managingSection.formation_section_courses?.length ?? 0)}
          section={managingSection}
          onClose={() => setManagingSection(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin-formacao-sections'] });
            setManagingSection(null);
          }}
        />
      )}
    </motion.div>
  );
}

// ─── StatusDropdown ────────────────────────────────────────────
function StatusDropdown({
  isActive,
  isOpen,
  isPending,
  onToggle,
  onSelect,
  onClickOutside,
}: {
  isActive: boolean;
  isOpen: boolean;
  isPending: boolean;
  onToggle: () => void;
  onSelect: (active: boolean) => void;
  onClickOutside: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClickOutside]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        disabled={isPending}
        className={cn(
          'flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded transition-colors',
          isActive
            ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25'
            : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
        )}
      >
        {isActive ? 'Ativa' : 'Inativa'}
        <svg
          className={cn('h-2.5 w-2.5 transition-transform', isOpen && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[110px] rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] shadow-lg overflow-hidden">
          <button
            onClick={() => onSelect(true)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left',
              isActive
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isActive ? 'bg-emerald-500' : 'bg-[var(--text-muted)]')} />
            Ativo
            {isActive && (
              <svg className="ml-auto h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </button>
          <div className="h-px bg-[var(--border-hairline)]" />
          <button
            onClick={() => onSelect(false)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left',
              !isActive
                ? 'text-[var(--text-secondary)] bg-[var(--bg-hover)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', !isActive ? 'bg-[var(--text-tertiary)]' : 'bg-[var(--text-muted)]')} />
            Inativo
            {!isActive && (
              <svg className="ml-auto h-3 w-3 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Manage Courses Modal ──────────────────────────────────────
function ManageSectionCoursesModal({
  section,
  onClose,
  onSaved,
}: {
  section: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: allCoursesData } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: adminListCourses,
  });

  const currentCourseIds = new Set(
    (section.formation_section_courses ?? []).map((sc: any) => sc.courses?.id).filter(Boolean),
  );

  const [selected, setSelected] = useState<Set<string>>(new Set(currentCourseIds));
  const allCourses = Array.isArray(allCoursesData) ? allCoursesData : [];

  const saveMutation = useMutation({
    mutationFn: () => {
      const courses = Array.from(selected).map((course_id, idx) => ({
        course_id,
        sort_order: idx,
      }));
      return adminUpdateSectionCourses(section.id, courses);
    },
    onSuccess: onSaved,
  });

  const toggleCourse = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal open onClose={onClose} className="sm:max-w-sm">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Cursos — {section.title}
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Selecione os cursos que aparecerão nesta seção.
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {allCourses.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">Nenhum curso encontrado.</p>
          ) : (
            allCourses.map((course: any) => (
              <button
                key={course.id}
                onClick={() => toggleCourse(course.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] border text-left transition-colors',
                  selected.has(course.id)
                    ? 'bg-[var(--bg-hover)] border-[var(--border-default)]'
                    : 'bg-[var(--bg-surface-1)] border-[var(--border-hairline)]',
                )}
              >
                <div className={cn(
                  'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                  selected.has(course.id)
                    ? 'bg-[var(--text-primary)] border-[var(--text-primary)]'
                    : 'border-[var(--border-default)]',
                )}>
                  {selected.has(course.id) && (
                    <svg className="h-3 w-3 text-[var(--bg-base)]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-[var(--text-primary)] truncate">{course.title}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Salvando...' : `Salvar (${selected.size})`}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
