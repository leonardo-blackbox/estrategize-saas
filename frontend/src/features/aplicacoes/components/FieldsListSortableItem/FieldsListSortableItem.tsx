import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditorStore, type LocalField } from '../../../../stores/editorStore.ts';
import { FieldsListItem } from '../FieldsListItem/index.ts';

interface FieldsListSortableItemProps {
  field: LocalField;
  index: number;
}

export function FieldsListSortableItem({ field, index }: FieldsListSortableItemProps) {
  const { selectedFieldIndex, selectField, removeField, duplicateField } = useEditorStore();

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
      <FieldsListItem
        field={field}
        index={index}
        isSelected={selectedFieldIndex === index}
        isDragging={isDragging}
        onSelect={() => selectField(index)}
        onDuplicate={(e) => {
          e.stopPropagation();
          duplicateField(index);
        }}
        onRemove={(e) => {
          e.stopPropagation();
          removeField(index);
        }}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
