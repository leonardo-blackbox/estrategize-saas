import { useEditorStore, type LocalField } from '../../../../stores/editorStore.ts';
import {
  OptionRow, TextInput, AutoTextarea, DateInput, Toggle,
} from '../FieldOptionsShared/index.ts';

interface FieldOptionsDateProps {
  field: LocalField;
  index: number;
}

export function FieldOptionsDate({ field, index }: FieldOptionsDateProps) {
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
      <DateInput
        label="Data minima"
        value={(opts.minDate as string) ?? ''}
        onChange={(v) =>
          updateField(index, { options: { ...opts, minDate: v || undefined } })
        }
      />
      <DateInput
        label="Data maxima"
        value={(opts.maxDate as string) ?? ''}
        onChange={(v) =>
          updateField(index, { options: { ...opts, maxDate: v || undefined } })
        }
      />
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
