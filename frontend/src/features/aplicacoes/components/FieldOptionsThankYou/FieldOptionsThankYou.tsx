import { useEditorStore, type LocalField } from '../../../../stores/editorStore.ts';
import { OptionRow, TextInput, AutoTextarea } from '../FieldOptionsShared/index.ts';

interface FieldOptionsThankYouProps {
  field: LocalField;
  index: number;
}

export function FieldOptionsThankYou({ field, index }: FieldOptionsThankYouProps) {
  const { updateField } = useEditorStore();
  const opts = (field.options as Record<string, unknown>) ?? {};

  return (
    <div className="flex flex-col gap-4 p-4">
      <OptionRow label="Titulo">
        <TextInput
          value={field.title}
          onChange={(v) => updateField(index, { title: v })}
          placeholder="Obrigado!"
        />
      </OptionRow>
      <OptionRow label="Mensagem">
        <AutoTextarea
          value={(opts.message as string) ?? ''}
          onValueChange={(v) =>
            updateField(index, { options: { ...opts, message: v } })
          }
          placeholder="Suas respostas foram recebidas."
        />
      </OptionRow>
    </div>
  );
}
