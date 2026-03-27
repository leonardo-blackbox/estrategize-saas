import { useEditorStore, type LocalField } from '../../../../stores/editorStore.ts';
import { OptionRow, TextInput, AutoTextarea } from '../FieldOptionsShared/index.ts';

interface FieldOptionsMessageProps {
  field: LocalField;
  index: number;
}

export function FieldOptionsMessage({ field, index }: FieldOptionsMessageProps) {
  const { updateField } = useEditorStore();

  return (
    <div className="flex flex-col gap-4 p-4">
      <OptionRow label="Titulo">
        <TextInput
          value={field.title}
          onChange={(v) => updateField(index, { title: v })}
          placeholder="Mensagem"
        />
      </OptionRow>
      <OptionRow label="Texto">
        <AutoTextarea
          value={field.description ?? ''}
          onValueChange={(v) => updateField(index, { description: v || undefined })}
          placeholder="Conteudo da mensagem..."
        />
      </OptionRow>
    </div>
  );
}
