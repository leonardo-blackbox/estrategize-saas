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
} from '@dnd-kit/sortable';
import { AnimatePresence } from 'framer-motion';
import { useEditorStore } from '../../../../stores/editorStore.ts';
import { type FieldType } from '../../../../api/applications.ts';
import { cn } from '../../../../lib/cn.ts';
import { FieldTypeSelector } from '../../../../components/aplicacoes/editor/FieldTypeSelector.tsx';
import { FieldsListSortableItem } from '../FieldsListSortableItem/index.ts';
import { FieldsListItem } from '../FieldsListItem/index.ts';

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
      <header
        className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-hairline)' }}
      >
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">Campos</span>
        <span
          className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(124,92,252,0.12)', color: '#7c5cfc' }}
        >
          {fields.length}
        </span>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {fields.length === 0 ? (
          <EmptyState />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.localId)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-0.5">
                {fields.map((field, index) => (
                  <FieldsListSortableItem key={field.localId} field={field} index={index} />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.16,1,0.3,1)' }}>
              {activeField && activeIndex !== -1 ? (
                <div className="rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[var(--border-default)] bg-[var(--bg-surface-2)]">
                  <FieldsListItem field={activeField} index={activeIndex} isSelected={false} isDragging onSelect={() => {}} onDuplicate={() => {}} onRemove={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <footer className="shrink-0 p-2" style={{ borderTop: '1px solid var(--border-hairline)', position: 'relative' }}>
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
        <AnimatePresence>
          {showTypeSelector && (
            <FieldTypeSelector onSelect={handleAddField} onClose={() => setShowTypeSelector(false)} />
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <span className="text-[32px] opacity-30">&#128203;</span>
      <span className="text-[12px] text-[var(--text-tertiary)]">Nenhum campo ainda</span>
    </div>
  );
}
