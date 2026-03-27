import { type LocalField } from '../../../../stores/editorStore.ts';
import { type ThemeConfig } from '../../../../api/applications.ts';

interface LivePreviewLongTextProps {
  field: LocalField;
  theme: ThemeConfig;
}

export function LivePreviewLongText({ field, theme }: LivePreviewLongTextProps) {
  const opts = !Array.isArray(field.options) ? (field.options as Record<string, unknown>) : {};
  const placeholder = (opts.placeholder as string | undefined) ?? 'Sua resposta...';
  const buttonLabel = (opts.buttonLabel as string | undefined) || 'OK';

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
      <textarea
        placeholder={placeholder}
        disabled
        rows={4}
        className="w-full outline-none bg-transparent border-b-2 pb-2 text-[15px] pointer-events-none resize-none"
        style={{ color: theme.answerColor, borderColor: `${theme.answerColor}40`, fontFamily: theme.fontFamily }}
      />
      <button
        className="self-start px-6 py-2.5 text-[13px] font-medium pointer-events-none"
        style={{
          background: theme.buttonColor,
          color: theme.buttonTextColor,
          borderRadius: `${theme.borderRadius}px`,
          fontFamily: theme.fontFamily,
        }}
      >
        {buttonLabel} &rarr;
      </button>
    </div>
  );
}
