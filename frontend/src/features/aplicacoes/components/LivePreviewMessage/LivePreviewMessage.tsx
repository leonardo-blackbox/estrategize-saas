import { type LocalField } from '../../../../stores/editorStore.ts';
import { type ThemeConfig } from '../../../../api/applications.ts';

interface LivePreviewMessageProps {
  field: LocalField;
  theme: ThemeConfig;
}

export function LivePreviewMessage({ field, theme }: LivePreviewMessageProps) {
  return (
    <div className="flex flex-col justify-center h-full gap-4 px-8">
      <h2
        className="text-[22px] font-semibold leading-snug"
        style={{ color: theme.questionColor, fontFamily: theme.fontFamily }}
      >
        {field.title}
      </h2>
      {field.description && (
        <p
          className="text-[14px] opacity-70 leading-relaxed"
          style={{ color: theme.questionColor, fontFamily: theme.fontFamily, whiteSpace: 'pre-wrap' }}
        >
          {field.description}
        </p>
      )}
      <button
        className="self-start px-6 py-2.5 text-[14px] font-medium pointer-events-none"
        style={{
          background: theme.buttonColor,
          color: theme.buttonTextColor,
          borderRadius: `${theme.borderRadius}px`,
          fontFamily: theme.fontFamily,
        }}
      >
        Continuar
      </button>
    </div>
  );
}
