import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { StatusDropdown } from './StatusDropdown.tsx';

export interface SectionCardCallbacks {
  onEditTitleChange: (value: string) => void;
  onEditSave: (id: string, title: string) => void;
  onEditCancel: () => void;
  onEditStart: (id: string, title: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onStatusToggle: (id: string) => void;
  onStatusSelect: (id: string, active: boolean) => void;
  onStatusClickOutside: () => void;
  onManageCourses: (section: any) => void;
  onDelete: (id: string) => void;
}

interface SectionCardProps extends SectionCardCallbacks {
  section: any;
  index: number;
  totalCount: number;
  editingId: string | null;
  editTitle: string;
  openStatusDropdown: string | null;
  isReorderPending: boolean;
  isUpdatePending: boolean;
}

export function SectionCard({ section, index, totalCount, editingId, editTitle,
  openStatusDropdown, isReorderPending, isUpdatePending,
  onEditTitleChange, onEditSave, onEditCancel, onEditStart,
  onMoveUp, onMoveDown, onStatusToggle, onStatusSelect, onStatusClickOutside,
  onManageCourses, onDelete }: SectionCardProps) {
  const courseCount = (section.formation_section_courses ?? []).length;
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border bg-[var(--bg-surface-1)] border-[var(--border-hairline)]', !section.is_active && 'opacity-50')}>
      <div className="flex flex-col gap-0.5 shrink-0">
        <button onClick={() => onMoveUp(index)} disabled={index === 0 || isReorderPending}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors p-0.5">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
        </button>
        <button onClick={() => onMoveDown(index)} disabled={index === totalCount - 1 || isReorderPending}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors p-0.5">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
        </button>
      </div>
      <div className="flex-1 min-w-0">
        {editingId === section.id ? (
          <div className="flex items-center gap-2">
            <input
              className="flex-1 text-sm bg-[var(--bg-hover)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--text-primary)] focus:outline-none"
              value={editTitle} onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onEditSave(section.id, editTitle); if (e.key === 'Escape') onEditCancel(); }}
              autoFocus
            />
            <button onClick={() => onEditSave(section.id, editTitle)} className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">Salvar</button>
            <button onClick={onEditCancel} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">Cancelar</button>
          </div>
        ) : (
          <button onClick={() => onEditStart(section.id, section.title)}
            className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-secondary)] transition-colors text-left">
            {section.title}
          </button>
        )}
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{courseCount} curso{courseCount !== 1 ? 's' : ''}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <StatusDropdown
          isActive={section.is_active} isOpen={openStatusDropdown === section.id}
          isPending={isUpdatePending}
          onToggle={() => onStatusToggle(section.id)}
          onSelect={(active) => onStatusSelect(section.id, active)}
          onClickOutside={onStatusClickOutside}
        />
        <Button size="sm" variant="ghost" onClick={() => onManageCourses(section)}>Cursos</Button>
        <button onClick={() => onDelete(section.id)} className="text-xs text-[var(--text-tertiary)] hover:text-red-500 transition-colors">Excluir</button>
      </div>
    </div>
  );
}
