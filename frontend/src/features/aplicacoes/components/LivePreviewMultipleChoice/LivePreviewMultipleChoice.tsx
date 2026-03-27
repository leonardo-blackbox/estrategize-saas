import { type LocalField } from '../../../../stores/editorStore.ts';
import { type ThemeConfig, type FieldOption } from '../../../../api/applications.ts';

interface LivePreviewMultipleChoiceProps {
  field: LocalField;
  theme: ThemeConfig;
}

export function LivePreviewMultipleChoice({ field, theme }: LivePreviewMultipleChoiceProps) {
  const rawOptions = field.options;
  const options: FieldOption[] = Array.isArray(rawOptions) ? rawOptions : [];

  return (
    <div className="flex flex-col justify-center h-full gap-5 px-8">
      <div className="flex flex-col gap-2">
        <label
          className="text-[18px] font-semibold leading-snug"
          style={{ color: theme.questionColor, fontFamily: theme.fontFamily }}
        >
          {field.title}
          {field.required && <span className="ml-1 text-[#ff453a] text-[14px]">*</span>}
        </label>
        {field.description && (
          <p
            className="text-[13px] opacity-60"
            style={{ color: theme.questionColor, fontFamily: theme.fontFamily, whiteSpace: 'pre-wrap' }}
          >
            {field.description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <div
            key={opt.id}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg border pointer-events-none"
            style={{
              borderColor: `${theme.answerColor}30`,
              color: theme.answerColor,
              borderRadius: `${theme.borderRadius}px`,
              fontFamily: theme.fontFamily,
              fontSize: 14,
            }}
          >
            <span
              className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold"
              style={{ borderColor: `${theme.answerColor}50`, color: theme.buttonColor }}
            >
              {String.fromCharCode(65 + i)}
            </span>
            {opt.label}
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-[12px] opacity-40 italic" style={{ color: theme.answerColor }}>
            Nenhuma opcao configurada
          </p>
        )}
      </div>
    </div>
  );
}
