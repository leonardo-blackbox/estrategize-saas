import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { AdminHomeStatusDropdown } from '../AdminHomeStatusDropdown/index.ts';

interface AdminHomeSectionRowProps {
  section: any;
  index: number;
  totalCount: number;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  setEditingId: (v: string | null) => void;
  openStatusDropdown: string | null;
  setOpenStatusDropdown: (v: string | null) => void;
  updateMutation: { mutate: (v: any) => void; isPending: boolean };
  reorderPending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onManage: () => void;
  onDelete: () => void;
}

export function AdminHomeSectionRow({
  section, index, totalCount,
  editingId, editTitle, setEditTitle, setEditingId,
  openStatusDropdown, setOpenStatusDropdown,
  updateMutation, reorderPending,
  onMoveUp, onMoveDown, onManage, onDelete,
}: AdminHomeSectionRowProps) {
  const courseCount = (section.formation_section_courses ?? []).length;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border',
        'bg-[var(--bg-surface-1)] border-[var(--border-hairline)]',
        !section.is_active && 'opacity-50',
      )}
    >
      {/* Reorder */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button onClick={onMoveUp} disabled={index === 0 || reorderPending} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors p-0.5">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        </button>
        <button onClick={onMoveDown} disabled={index === totalCount - 1 || reorderPending} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors p-0.5">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Title */}
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
            <button onClick={() => updateMutation.mutate({ id: section.id, data: { title: editTitle } })} className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">Salvar</button>
            <button onClick={() => setEditingId(null)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">Cancelar</button>
          </div>
        ) : (
          <button onClick={() => { setEditingId(section.id); setEditTitle(section.title); }} className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors text-left">
            {section.title}
          </button>
        )}
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {courseCount} curso{courseCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-2">
        <AdminHomeStatusDropdown
          isActive={section.is_active}
          isOpen={openStatusDropdown === section.id}
          isPending={updateMutation.isPending}
          onToggle={() => setOpenStatusDropdown(openStatusDropdown === section.id ? null : section.id)}
          onSelect={(active) => { updateMutation.mutate({ id: section.id, data: { is_active: active } }); setOpenStatusDropdown(null); }}
          onClickOutside={() => setOpenStatusDropdown(null)}
        />
        <Button size="sm" variant="ghost" onClick={onManage}>Cursos</Button>
        <button onClick={onDelete} className="text-xs text-[var(--text-tertiary)] hover:text-red-500 transition-colors">Excluir</button>
      </div>
    </div>
  );
}
