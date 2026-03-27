import { type LocalField } from '../../../../stores/editorStore.ts';
import { type ThemeConfig } from '../../../../api/applications.ts';

interface LivePreviewThankYouProps {
  field: LocalField;
  theme: ThemeConfig;
}

export function LivePreviewThankYou({ field, theme }: LivePreviewThankYouProps) {
  const opts = field.options as Record<string, unknown>;
  const message = (opts.message as string) ?? 'Suas respostas foram recebidas.';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-[28px]"
        style={{ background: `${theme.buttonColor}20` }}
      >
        <span style={{ color: theme.buttonColor }}>&#10003;</span>
      </div>
      <div className="flex flex-col gap-2">
        <h1
          className="text-[26px] font-bold"
          style={{ color: theme.questionColor, fontFamily: theme.fontFamily }}
        >
          {field.title}
        </h1>
        {message && (
          <p
            className="text-[14px] opacity-70 leading-relaxed"
            style={{ color: theme.questionColor, fontFamily: theme.fontFamily }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
