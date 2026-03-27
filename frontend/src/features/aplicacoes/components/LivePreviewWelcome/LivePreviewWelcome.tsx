import { type LocalField } from '../../../../stores/editorStore.ts';
import { type ThemeConfig } from '../../../../api/applications.ts';

interface LivePreviewWelcomeProps {
  field: LocalField;
  theme: ThemeConfig;
}

export function LivePreviewWelcome({ field, theme }: LivePreviewWelcomeProps) {
  const opts = field.options as Record<string, unknown>;
  const description = (opts.description as string) ?? field.description ?? '';
  const buttonText = (opts.buttonText as string) ?? 'Comecar';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
      {theme.logoUrl && (
        <img
          src={theme.logoUrl}
          alt="Logo"
          style={{ height: 40, objectFit: 'contain', maxWidth: 160 }}
        />
      )}
      <div className="flex flex-col gap-3">
        <h1
          className="text-[28px] font-bold leading-tight"
          style={{ color: theme.questionColor, fontFamily: theme.fontFamily }}
        >
          {field.title}
        </h1>
        {description && (
          <p
            className="text-[15px] opacity-70 leading-relaxed"
            style={{ color: theme.questionColor, fontFamily: theme.fontFamily, whiteSpace: 'pre-wrap' }}
          >
            {description}
          </p>
        )}
      </div>
      <button
        className="px-8 py-3 rounded-xl text-[15px] font-semibold pointer-events-none"
        style={{
          background: theme.buttonColor,
          color: theme.buttonTextColor,
          borderRadius: `${theme.borderRadius}px`,
          fontFamily: theme.fontFamily,
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}
