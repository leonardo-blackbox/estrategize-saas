import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence } from 'framer-motion';
import { useEditorStore, type LocalField } from '../../../stores/editorStore.ts';
import { type FieldType } from '../../../api/applications.ts';
import { cn } from '../../../lib/cn.ts';
import { FieldTypeSelector } from './FieldTypeSelector.tsx';

// ─────────────────────────────────────────────
// Metadata & colors
// ─────────────────────────────────────────────

const FIELD_TYPE_META: Record<FieldType, { label: string; icon: string }> = {
  welcome: { label: 'Boas-vindas', icon: 'Hi' },
  message: { label: 'Mensagem', icon: '¶' },
  short_text: { label: 'Texto Curto', icon: 'Aa' },
  long_text: { label: 'Texto Longo', icon: '☰' },
  name: { label: 'Nome', icon: 'Ab' },
  email: { label: 'E-mail', icon: '@' },
  phone: { label: 'Telefone', icon: 'Tel' },
  multiple_choice: { label: 'Múltipla', icon: '◉' },
  number: { label: 'Número', icon: '#' },
  date: { label: 'Data', icon: 'Dt' },
  thank_you: { label: 'Agradecimento', icon: '✓' },
};

const TYPE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  short_text: { bg: 'rgba(50,173,230,0.12)', text: '#32ade6' },
  long_text: { bg: 'rgba(50,173,230,0.12)', text: '#32ade6' },
  name: { bg: 'rgba(50,173,230,0.12)', text: '#32ade6' },
  multiple_choice: { bg: 'rgba(124,92,252,0.12)', text: '#7c5cfc' },
  email: { bg: 'rgba(48,209,88,0.12)', text: '#30d158' },
  phone: { bg: 'rgba(48,209,88,0.12)', text: '#30d158' },
  number: { bg: 'rgba(255,159,10,0.12)', text: '#ff9f0a' },
  date: { bg: 'rgba(100,210,255,0.12)', text: '#64d2ff' },
  welcome: { bg: 'rgba(110,110,115,0.12)', text: '#8e8e93' },
  message: { bg: 'rgba(110,110,115,0.12)', text: '#8e8e93' },
  thank_you: { bg: 'rgba(48,209,88,0.12)', text: '#30d158' },
};

// ─────────────────────────────────────────────
// TypeBadge
// ─────────────────────────────────────────────

function TypeBadge({ type }: { type: FieldType }) {
  const meta = FIELD_TYPE_META[type];
  const color = TYPE_BADGE_COLORS[type] ?? { bg: 'rgba(110,110,115,0.12)', text: '#8e8e93' };

  return (
    <span
      className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none"
      style={{ background: color.bg, color: color.text }}
    >
      {meta.icon} <span className="ml-1">{meta.label}</span>
    </span>
  );
}

// ─────────────────────────────────────────────
// DragHandle (6-dot grid)
// ─────────────────────────────────────────────

function DragHandle(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('shrink-0 flex flex-col gap-[3px] cursor-grab active:cursor-grabbing', props.className)}
      style={{ width: 12, ...props.style }}
    >
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-[3px]">
          <div className="w-[3px] h-[3px] rounded-full bg-current opacity-40" />
          <div className="w-[3px] h-[3px] rounded-full bg-current opacity-40" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// FieldItem (used in DragOverlay)
// ─────────────────────────────────────────────

interface FieldItemProps {
  field: LocalField;
  index: number;
  isSelected: boolean;
  isDragging?: boolean;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

function FieldItem({
  field,
  index,
  isSelected,
  isDragging,
  onSelect,
  onRemove,
  dragHandleProps,
}: FieldItemProps) {
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
      {/* Drag handle — shows on hover or when selected */}
      <DragHandle
        {...dragHandleProps}
        className={cn(
          'text-[var(--text-tertiary)] transition-opacity duration-100',
          'opacity-0 group-hover:opacity-100',
          isSelected && 'opacity-100',
        )}
      />

      {/* Index */}
      <span className="shrink-0 w-5 text-center text-[11px] text-[var(--text-tertiary)] font-mono">
        {index + 1}
      </span>

      {/* Type badge */}
      <TypeBadge type={field.type} />

      {/* Title */}
      <span className="flex-1 text-[13px] text-[var(--text-primary)] truncate">
        {field.title || '(sem título)'}
      </span>

      {/* Remove button */}
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
        ×
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// SortableFieldItem
// ─────────────────────────────────────────────

interface SortableFieldItemProps {
  field: LocalField;
  index: number;
}

function SortableFieldItem({ field, index }: SortableFieldItemProps) {
  const { selectedFieldIndex, selectField, removeField } = useEditorStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.localId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FieldItem
        field={field}
        index={index}
        isSelected={selectedFieldIndex === index}
        isDragging={isDragging}
        onSelect={() => selectField(index)}
        onRemove={(e) => {
          e.stopPropagation();
          removeField(index);
        }}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// FieldsListPanel
// ─────────────────────────────────────────────

export function FieldsListPanel() {
  const { fields, addField, reorderFields } = useEditorStore();
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeField = activeId ? fields.find((f) => f.localId === activeId) : null;
  const activeIndex = activeId ? fields.findIndex((f) => f.localId === activeId) : -1;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.localId === active.id);
    const newIndex = fields.findIndex((f) => f.localId === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderFields(oldIndex, newIndex);
    }
  }

  function handleAddField(type: FieldType) {
    addField(type);
    setShowTypeSelector(false);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-surface-1)',
        borderRight: '1px solid var(--border-hairline)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-hairline)' }}
      >
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          Campos
        </span>
        <span
          className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(124,92,252,0.12)', color: '#7c5cfc' }}
        >
          {fields.length}
        </span>
      </header>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <span className="text-[32px] opacity-30">📋</span>
            <span className="text-[12px] text-[var(--text-tertiary)]">
              Nenhum campo ainda
            </span>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.localId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-0.5">
                {fields.map((field, index) => (
                  <SortableFieldItem key={field.localId} field={field} index={index} />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.16,1,0.3,1)' }}>
              {activeField && activeIndex !== -1 ? (
                <div className="rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[var(--border-default)] bg-[var(--bg-surface-2)]">
                  <FieldItem
                    field={activeField}
                    index={activeIndex}
                    isSelected={false}
                    isDragging
                    onSelect={() => {}}
                    onRemove={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Footer */}
      <footer
        className="shrink-0 p-2"
        style={{ borderTop: '1px solid var(--border-hairline)', position: 'relative' }}
      >
        <button
          onClick={() => setShowTypeSelector((v) => !v)}
          className={cn(
            'w-full flex items-center justify-center gap-2',
            'py-2.5 rounded-lg text-[13px] font-medium',
            'text-[var(--accent)] border border-dashed border-[rgba(124,92,252,0.4)]',
            'hover:bg-[rgba(124,92,252,0.08)] transition-colors duration-150',
          )}
        >
          + Adicionar campo
        </button>

        {/* Type Selector */}
        <AnimatePresence>
          {showTypeSelector && (
            <FieldTypeSelector
              onSelect={handleAddField}
              onClose={() => setShowTypeSelector(false)}
            />
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
}
