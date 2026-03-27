import { type LocalField } from '../../../../stores/editorStore.ts';
import { cn } from '../../../../lib/cn.ts';
import { FieldsListTypeBadge } from '../FieldsListTypeBadge/index.ts';
import { FieldsListDragHandle } from '../FieldsListDragHandle/index.ts';

export interface FieldsListItemProps {
  field: LocalField;
  index: number;
  isSelected: boolean;
  isDragging?: boolean;
  onSelect: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function FieldsListItem({
  field, index, isSelected, isDragging, onSelect, onDuplicate, onRemove, dragHandleProps,
}: FieldsListItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer',
        'transition-all duration-[120ms]',
        isSelected
          ? 'bg-[rgba(124,92,252,0.12)] border border-[rgba(124,92,252,0.4)]'
          : 'border border-transparent hover:bg-[var(--bg-hover)]',
        isDragging && 'opacity-50 scale-[1.02] shadow-lg',
      )}
    >
      <FieldsListDragHandle
        {...dragHandleProps}
        className={cn(
          'text-[var(--text-tertiary)] transition-opacity duration-100',
          'opacity-0 group-hover:opacity-100',
          isSelected && 'opacity-100',
        )}
      />
      <span className="shrink-0 w-5 text-center text-[11px] text-[var(--text-tertiary)] font-mono">
        {index + 1}
      </span>
      <FieldsListTypeBadge type={field.type} />
      <span className="flex-1 text-[13px] text-[var(--text-primary)] truncate">
        {field.title || '(sem titulo)'}
      </span>
      <button
        onClick={onDuplicate}
        className={cn(
          'shrink-0 w-5 h-5 flex items-center justify-center rounded',
          'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-100',
        )}
        title="Duplicar campo"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 8V1h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={onRemove}
        className={cn(
          'shrink-0 w-5 h-5 flex items-center justify-center rounded',
          'text-[var(--text-tertiary)] hover:text-[#ff453a] hover:bg-[rgba(255,69,58,0.12)]',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-100',
          'text-[14px] leading-none',
        )}
        title="Remover campo"
      >
        x
      </button>
    </div>
  );
}
