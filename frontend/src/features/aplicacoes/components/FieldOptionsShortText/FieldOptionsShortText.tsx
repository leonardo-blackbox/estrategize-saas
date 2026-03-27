import { useEditorStore, type LocalField } from '../../../../stores/editorStore.ts';
import {
  OptionRow, TextInput, AutoTextarea, NumberInput, Toggle,
} from '../FieldOptionsShared/index.ts';

interface FieldOptionsShortTextProps {
  field: LocalField;
  index: number;
}

export function FieldOptionsShortText({ field, index }: FieldOptionsShortTextProps) {
  const { updateField } = useEditorStore();
  const opts = (field.options as Record<string, unknown>) ?? {};

  return (
    <div className="flex flex-col gap-4 p-4">
      <OptionRow label="Pergunta">
        <AutoTextarea
          value={field.title}
          onValueChange={(v) => updateField(index, { title: v })}
          placeholder="Digite a pergunta..."
        />
      </OptionRow>
      <OptionRow label="Descricao (opcional)">
        <AutoTextarea
          value={field.description ?? ''}
          onValueChange={(v) => updateField(index, { description: v || undefined })}
          placeholder="Instrucao ou detalhe adicional..."
        />
      </OptionRow>
      <OptionRow label="Placeholder">
        <TextInput
          value={(opts.placeholder as string) ?? ''}
          onChange={(v) => updateField(index, { options: { ...opts, placeholder: v || undefined } })}
          placeholder="Texto de exemplo no campo..."
        />
      </OptionRow>
      <OptionRow label="Limite de caracteres">
        <NumberInput
          value={(opts.maxLength as number | undefined)?.toString() ?? ''}
          onChange={(v) =>
            updateField(index, { options: { ...opts, maxLength: v ? Number(v) : undefined } })
          }
          placeholder="Sem limite"
          min={1}
        />
      </OptionRow>
      <OptionRow label="Texto do botao">
        <TextInput
          value={(opts.buttonLabel as string) ?? ''}
          onChange={(v) => updateField(index, { options: { ...opts, buttonLabel: v || undefined } })}
          placeholder="OK"
        />
      </OptionRow>
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
        style={{ background: 'var(--bg-surface-2)' }}
      >
        <Toggle
          label="Obrigatorio"
          checked={field.required}
          onChange={(v) => updateField(index, { required: v })}
        />
      </div>
    </div>
  );
}
