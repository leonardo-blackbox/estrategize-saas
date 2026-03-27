import { useEditorStore, type LocalField } from '../../../../stores/editorStore.ts';
import { type FieldOption } from '../../../../api/applications.ts';
import { cn } from '../../../../lib/cn.ts';
import { OptionRow, AutoTextarea, Toggle, TextInput } from '../FieldOptionsShared/index.ts';

interface FieldOptionsMultipleChoiceProps {
  field: LocalField;
  index: number;
}

export function FieldOptionsMultipleChoice({ field, index }: FieldOptionsMultipleChoiceProps) {
  const { updateField } = useEditorStore();
  const rawOptions = Array.isArray(field.options) ? (field.options as FieldOption[]) : [];
  const options = rawOptions;
  const logicData = field.conditional_logic as unknown as Record<string, unknown>;
  const allowMultiple = Boolean(logicData.allowMultiple);
  const buttonLabel = (logicData.buttonLabel as string | undefined) ?? '';

  function updateOptions(updated: FieldOption[]) {
    updateField(index, { options: updated });
  }

  function addOption() {
    const newOpt: FieldOption = { id: crypto.randomUUID(), label: `Opcao ${options.length + 1}` };
    updateOptions([...options, newOpt]);
  }

  function removeOption(id: string) {
    updateOptions(options.filter((o) => o.id !== id));
  }

  function updateOptionLabel(id: string, label: string) {
    updateOptions(options.map((o) => (o.id === id ? { ...o, label } : o)));
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <OptionRow label="Pergunta">
        <AutoTextarea
          value={field.title}
          onValueChange={(v) => updateField(index, { title: v })}
          placeholder="Escolha uma opcao"
        />
      </OptionRow>

      <OptionRow label="Descricao (opcional)">
        <AutoTextarea
          value={field.description ?? ''}
          onValueChange={(v) => updateField(index, { description: v || undefined })}
          placeholder="Instrucao ou detalhe adicional..."
        />
      </OptionRow>

      <OptionRow label="Opcoes">
        <div className="flex flex-col gap-1.5">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-[var(--border-default)] shrink-0" />
              <input
                type="text"
                value={opt.label}
                onChange={(e) => updateOptionLabel(opt.id, e.target.value)}
                className={cn(
                  'flex-1 bg-transparent border-b border-[var(--border-hairline)]',
                  'text-[13px] text-[var(--text-primary)] outline-none',
                  'focus:border-[var(--accent)] transition-colors py-1',
                )}
              />
              <button
                onClick={() => removeOption(opt.id)}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[#ff453a] hover:bg-[rgba(255,69,58,0.1)] transition-colors text-[14px]"
              >
                x
              </button>
            </div>
          ))}
          <button
            onClick={addOption}
            className={cn(
              'flex items-center gap-1.5 text-[12px] text-[var(--accent)]',
              'hover:opacity-70 transition-opacity mt-1 w-fit',
            )}
          >
            + Adicionar opcao
          </button>
        </div>
      </OptionRow>

      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
        style={{ background: 'var(--bg-surface-2)' }}
      >
        <Toggle
          label="Permitir multipla selecao"
          checked={allowMultiple}
          onChange={(v) =>
            updateField(index, {
              conditional_logic: {
                ...logicData,
                allowMultiple: v,
              } as unknown as LocalField['conditional_logic'],
            })
          }
        />
      </div>

      {allowMultiple && (
        <OptionRow label="Texto do botao OK">
          <TextInput
            value={buttonLabel}
            onChange={(v) =>
              updateField(index, {
                conditional_logic: {
                  ...logicData,
                  buttonLabel: v || undefined,
                } as unknown as LocalField['conditional_logic'],
              })
            }
            placeholder="OK"
          />
        </OptionRow>
      )}

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
