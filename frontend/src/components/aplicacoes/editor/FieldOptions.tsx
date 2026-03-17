import { useId, useRef, useEffect } from 'react';
import { useEditorStore, type LocalField } from '../../../stores/editorStore.ts';
import { type FieldType, type FieldOption } from '../../../api/applications.ts';
import { cn } from '../../../lib/cn.ts';

// ─────────────────────────────────────────────
// TYPE badge colors
// ─────────────────────────────────────────────

const FIELD_TYPE_META: Record<FieldType, { label: string; icon: string }> = {
  welcome: { label: 'Boas-vindas', icon: '👋' },
  message: { label: 'Mensagem', icon: '💬' },
  short_text: { label: 'Texto Curto', icon: 'Aa' },
  long_text: { label: 'Texto Longo', icon: '☰' },
  name: { label: 'Nome', icon: '👤' },
  email: { label: 'E-mail', icon: '@' },
  phone: { label: 'Telefone', icon: '📞' },
  multiple_choice: { label: 'Múltipla Escolha', icon: '◉' },
  number: { label: 'Número', icon: '#' },
  date: { label: 'Data', icon: '📅' },
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
// Small shared UI primitives
// ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
      {children}
    </span>
  );
}

// Toggle switch (Apple-style)
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  label?: string;
}

function Toggle({ checked, onChange, id, label }: ToggleProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label htmlFor={inputId} className="flex items-center gap-2.5 cursor-pointer group">
      {label && (
        <span className="text-[13px] text-[var(--text-primary)] select-none">{label}</span>
      )}
      <div className="relative ml-auto">
        <input
          id={inputId}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            'w-9 h-5 rounded-full transition-colors duration-200',
            checked ? 'bg-[var(--accent)]' : 'bg-[rgba(120,120,128,0.32)]',
          )}
        />
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm',
            'transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </div>
    </label>
  );
}

// Auto-resize textarea
interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onValueChange: (v: string) => void;
}

function AutoTextarea({ value, onValueChange, ...rest }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      rows={2}
      className={cn(
        'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
        'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
        'outline-none focus:border-[var(--accent)] transition-colors',
        'resize-none overflow-hidden leading-relaxed',
      )}
      {...rest}
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
        'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
        'outline-none focus:border-[var(--accent)] transition-colors',
      )}
    />
  );
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// ColorPicker row
// ─────────────────────────────────────────────

interface ColorPickerRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function ColorPickerRow({ label, value, onChange }: ColorPickerRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] text-[var(--text-primary)]">{label}</span>
      <button
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg',
          'border border-[var(--border-default)] hover:border-[var(--border-subtle)]',
          'bg-[var(--bg-surface-2)] transition-colors',
        )}
        title={value}
      >
        <span
          className="w-4 h-4 rounded-[4px] border border-[rgba(255,255,255,0.15)] shrink-0"
          style={{ background: value }}
        />
        <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
          {value}
        </span>
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// AppearanceSettings
// ─────────────────────────────────────────────

function AppearanceSettings() {
  const { themeConfig, updateTheme } = useEditorStore();

  const FONT_OPTIONS = ['Inter', 'Poppins', 'Playfair Display', 'Roboto', 'Montserrat'];

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Colors section */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Cores</SectionLabel>
        <div className="flex flex-col gap-2.5">
          <ColorPickerRow
            label="Fundo"
            value={themeConfig.backgroundColor}
            onChange={(v) => updateTheme({ backgroundColor: v })}
          />
          <ColorPickerRow
            label="Perguntas"
            value={themeConfig.questionColor}
            onChange={(v) => updateTheme({ questionColor: v })}
          />
          <ColorPickerRow
            label="Respostas"
            value={themeConfig.answerColor}
            onChange={(v) => updateTheme({ answerColor: v })}
          />
          <ColorPickerRow
            label="Botão"
            value={themeConfig.buttonColor}
            onChange={(v) => updateTheme({ buttonColor: v })}
          />
          <ColorPickerRow
            label="Texto do botão"
            value={themeConfig.buttonTextColor}
            onChange={(v) => updateTheme({ buttonTextColor: v })}
          />
        </div>
      </div>

      {/* Font */}
      <div className="flex flex-col gap-2">
        <SectionLabel>Tipografia</SectionLabel>
        <select
          value={themeConfig.fontFamily}
          onChange={(e) => updateTheme({ fontFamily: e.target.value })}
          className={cn(
            'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
            'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
            'outline-none focus:border-[var(--accent)] transition-colors cursor-pointer',
          )}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Border radius */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <SectionLabel>Arredondamento</SectionLabel>
          <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
            {themeConfig.borderRadius}px
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={24}
          step={1}
          value={themeConfig.borderRadius}
          onChange={(e) => updateTheme({ borderRadius: Number(e.target.value) })}
          className="w-full accent-[var(--accent)] cursor-pointer"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FieldSettings — Welcome
// ─────────────────────────────────────────────

interface FieldSettingsProps {
  field: LocalField;
  index: number;
}

function WelcomeSettings({ field, index }: FieldSettingsProps) {
  const { updateField } = useEditorStore();
  const opts = (field.options as Record<string, unknown>) ?? {};

  return (
    <div className="flex flex-col gap-4 p-4">
      <OptionRow label="Título">
        <TextInput
          value={field.title}
          onChange={(v) => updateField(index, { title: v })}
          placeholder="Bem-vindo(a)!"
        />
      </OptionRow>
      <OptionRow label="Descrição">
        <AutoTextarea
          value={(opts.description as string) ?? field.description ?? ''}
          onValueChange={(v) =>
            updateField(index, { options: { ...opts, description: v } })
          }
          placeholder="Texto de introdução opcional..."
        />
      </OptionRow>
      <OptionRow label="Texto do botão">
        <TextInput
          value={(opts.buttonText as string) ?? 'Começar'}
          onChange={(v) => updateField(index, { options: { ...opts, buttonText: v } })}
          placeholder="Começar"
        />
      </OptionRow>
    </div>
  );
}

// ─────────────────────────────────────────────
// FieldSettings — ThankYou
// ─────────────────────────────────────────────

function ThankYouSettings({ field, index }: FieldSettingsProps) {
  const { updateField } = useEditorStore();
  const opts = (field.options as Record<string, unknown>) ?? {};

  return (
    <div className="flex flex-col gap-4 p-4">
      <OptionRow label="Título">
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

// ─────────────────────────────────────────────
// FieldSettings — MultipleChoice
// ─────────────────────────────────────────────

function MultipleChoiceSettings({ field, index }: FieldSettingsProps) {
  const { updateField } = useEditorStore();
  // options is FieldOption[] for multiple_choice; we keep allowMultiple in conditional_logic.conditions
  // as a workaround since options[] doesn't support arbitrary keys.
  // We store it as a separate key by using a Record when options is not an array.
  const rawOptions = Array.isArray(field.options) ? (field.options as FieldOption[]) : [];
  const options = rawOptions;
  // allowMultiple is stored in the options array as a sentinel or in conditional_logic metadata
  // For simplicity, use field.conditional_logic as a carrier (already Record-like in practice)
  const allowMultiple = Boolean(
    (field.conditional_logic as unknown as Record<string, unknown>).allowMultiple,
  );

  function updateOptions(updated: FieldOption[]) {
    updateField(index, { options: updated });
  }

  function addOption() {
    const newOpt: FieldOption = { id: crypto.randomUUID(), label: `Opção ${options.length + 1}` };
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
          placeholder="Escolha uma opção"
        />
      </OptionRow>

      <OptionRow label="Opções">
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
                ×
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
            + Adicionar opção
          </button>
        </div>
      </OptionRow>

      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
        style={{ background: 'var(--bg-surface-2)' }}
      >
        <Toggle
          label="Permitir múltipla seleção"
          checked={allowMultiple}
          onChange={(v) =>
            updateField(index, {
              conditional_logic: {
                ...(field.conditional_logic as unknown as Record<string, unknown>),
                allowMultiple: v,
              } as unknown as LocalField['conditional_logic'],
            })
          }
        />
      </div>

      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
        style={{ background: 'var(--bg-surface-2)' }}
      >
        <Toggle
          label="Obrigatório"
          checked={field.required}
          onChange={(v) => updateField(index, { required: v })}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Small numeric input
// ─────────────────────────────────────────────

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className={cn(
        'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
        'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
        'outline-none focus:border-[var(--accent)] transition-colors',
      )}
    />
  );
}

function DateInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
          'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
          'outline-none focus:border-[var(--accent)] transition-colors',
        )}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// FieldSettings — Generic (text-based fields)
// ─────────────────────────────────────────────

function GenericFieldSettings({ field, index }: FieldSettingsProps) {
  const { updateField } = useEditorStore();
  const opts = (field.options as Record<string, unknown>) ?? {};

  const showPlaceholder = ['short_text', 'long_text', 'name', 'email', 'phone', 'number'].includes(
    field.type,
  );
  const showMaxLength = ['short_text', 'long_text'].includes(field.type);
  const showMinMax = field.type === 'number';
  const showDateRange = field.type === 'date';

  return (
    <div className="flex flex-col gap-4 p-4">
      <OptionRow label="Pergunta">
        <AutoTextarea
          value={field.title}
          onValueChange={(v) => updateField(index, { title: v })}
          placeholder="Digite a pergunta..."
        />
      </OptionRow>

      <OptionRow label="Descrição (opcional)">
        <AutoTextarea
          value={field.description ?? ''}
          onValueChange={(v) => updateField(index, { description: v || undefined })}
          placeholder="Instrução ou detalhe adicional..."
        />
      </OptionRow>

      {showPlaceholder && (
        <OptionRow label="Placeholder">
          <TextInput
            value={(opts.placeholder as string) ?? ''}
            onChange={(v) => updateField(index, { options: { ...opts, placeholder: v || undefined } })}
            placeholder="Texto de exemplo no campo..."
          />
        </OptionRow>
      )}

      {showMaxLength && (
        <OptionRow label="Limite de caracteres">
          <NumberInput
            value={(opts.maxLength as number | undefined)?.toString() ?? ''}
            onChange={(v) =>
              updateField(index, {
                options: { ...opts, maxLength: v ? Number(v) : undefined },
              })
            }
            placeholder="Sem limite"
            min={1}
          />
        </OptionRow>
      )}

      {showMinMax && (
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <SectionLabel>Mínimo</SectionLabel>
            <NumberInput
              value={(opts.min as number | undefined)?.toString() ?? ''}
              onChange={(v) =>
                updateField(index, { options: { ...opts, min: v ? Number(v) : undefined } })
              }
              placeholder="—"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <SectionLabel>Máximo</SectionLabel>
            <NumberInput
              value={(opts.max as number | undefined)?.toString() ?? ''}
              onChange={(v) =>
                updateField(index, { options: { ...opts, max: v ? Number(v) : undefined } })
              }
              placeholder="—"
            />
          </div>
        </div>
      )}

      {showDateRange && (
        <>
          <DateInput
            label="Data mínima"
            value={(opts.minDate as string) ?? ''}
            onChange={(v) =>
              updateField(index, { options: { ...opts, minDate: v || undefined } })
            }
          />
          <DateInput
            label="Data máxima"
            value={(opts.maxDate as string) ?? ''}
            onChange={(v) =>
              updateField(index, { options: { ...opts, maxDate: v || undefined } })
            }
          />
        </>
      )}

      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
        style={{ background: 'var(--bg-surface-2)' }}
      >
        <Toggle
          label="Obrigatório"
          checked={field.required}
          onChange={(v) => updateField(index, { required: v })}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MessageSettings
// ─────────────────────────────────────────────

function MessageSettings({ field, index }: FieldSettingsProps) {
  const { updateField } = useEditorStore();

  return (
    <div className="flex flex-col gap-4 p-4">
      <OptionRow label="Título">
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
          placeholder="Conteúdo da mensagem..."
        />
      </OptionRow>
    </div>
  );
}

// ─────────────────────────────────────────────
// FieldSettings dispatcher
// ─────────────────────────────────────────────

function FieldSettings({ field, index }: FieldSettingsProps) {
  const meta = FIELD_TYPE_META[field.type];
  const color = TYPE_BADGE_COLORS[field.type] ?? { bg: 'rgba(110,110,115,0.12)', text: '#8e8e93' };

  const renderBody = () => {
    switch (field.type) {
      case 'welcome':
        return <WelcomeSettings field={field} index={index} />;
      case 'thank_you':
        return <ThankYouSettings field={field} index={index} />;
      case 'message':
        return <MessageSettings field={field} index={index} />;
      case 'multiple_choice':
        return <MultipleChoiceSettings field={field} index={index} />;
      default:
        return <GenericFieldSettings field={field} index={index} />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Field type header */}
      <div
        className="shrink-0 flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-hairline)' }}
      >
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium"
          style={{ background: color.bg, color: color.text }}
        >
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
        </span>
        <span className="text-[12px] text-[var(--text-tertiary)] truncate">
          Campo #{index + 1}
        </span>
      </div>

      {/* Scrollable settings body */}
      <div className="flex-1 overflow-y-auto">{renderBody()}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FieldOptionsPanel
// ─────────────────────────────────────────────

export function FieldOptionsPanel() {
  const { fields, selectedFieldIndex } = useEditorStore();

  const selectedField =
    selectedFieldIndex !== null ? fields[selectedFieldIndex] ?? null : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '320px',
        height: '100%',
        background: 'var(--bg-surface-1)',
        borderLeft: '1px solid var(--border-hairline)',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        className="shrink-0 flex items-center px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-hairline)' }}
      >
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          {selectedField ? 'Configurações' : 'Aparência'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedField !== null && selectedFieldIndex !== null ? (
          <FieldSettings field={selectedField} index={selectedFieldIndex} />
        ) : (
          <AppearanceSettings />
        )}
      </div>
    </div>
  );
}
