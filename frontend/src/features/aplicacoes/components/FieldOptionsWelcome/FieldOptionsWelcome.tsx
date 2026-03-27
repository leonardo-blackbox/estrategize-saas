import { useEditorStore, type LocalField } from '../../../../stores/editorStore.ts';
import { OptionRow, TextInput, AutoTextarea } from '../FieldOptionsShared/index.ts';

interface FieldOptionsWelcomeProps {
  field: LocalField;
  index: number;
}

export function FieldOptionsWelcome({ field, index }: FieldOptionsWelcomeProps) {
  const { updateField } = useEditorStore();
  const opts = (field.options as Record<string, unknown>) ?? {};

  return (
    <div className="flex flex-col gap-4 p-4">
      <OptionRow label="Titulo">
        <TextInput
          value={field.title}
          onChange={(v) => updateField(index, { title: v })}
          placeholder="Bem-vindo(a)!"
        />
      </OptionRow>
      <OptionRow label="Descricao">
        <AutoTextarea
          value={(opts.description as string) ?? field.description ?? ''}
          onValueChange={(v) =>
            updateField(index, { options: { ...opts, description: v } })
          }
          placeholder="Texto de introducao opcional..."
        />
      </OptionRow>
      <OptionRow label="Texto do botao">
        <TextInput
          value={(opts.buttonText as string) ?? 'Comecar'}
          onChange={(v) => updateField(index, { options: { ...opts, buttonText: v } })}
          placeholder="Comecar"
        />
      </OptionRow>
    </div>
  );
}
