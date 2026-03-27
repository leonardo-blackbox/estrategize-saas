import { useEditorStore, type LocalField } from '../../../../stores/editorStore.ts';
import {
  OptionRow, TextInput, AutoTextarea, NumberInput, Toggle, SectionLabel,
} from '../FieldOptionsShared/index.ts';

interface FieldOptionsNumberProps {
  field: LocalField;
  index: number;
}

export function FieldOptionsNumber({ field, index }: FieldOptionsNumberProps) {
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
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1.5">
          <SectionLabel>Minimo</SectionLabel>
          <NumberInput
            value={(opts.min as number | undefined)?.toString() ?? ''}
            onChange={(v) =>
              updateField(index, { options: { ...opts, min: v ? Number(v) : undefined } })
            }
            placeholder="--"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <SectionLabel>Maximo</SectionLabel>
          <NumberInput
            value={(opts.max as number | undefined)?.toString() ?? ''}
            onChange={(v) =>
              updateField(index, { options: { ...opts, max: v ? Number(v) : undefined } })
            }
            placeholder="--"
          />
        </div>
      </div>
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
