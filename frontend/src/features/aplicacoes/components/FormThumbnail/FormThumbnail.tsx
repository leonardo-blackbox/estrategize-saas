import type { Application } from '../../../../api/applications.ts';

interface FormThumbnailProps {
  form: Application;
}

export function FormThumbnail({ form }: FormThumbnailProps) {
  const bg = form.theme_config?.backgroundColor ?? '#000000';
  const btn = form.theme_config?.buttonColor ?? '#7c5cfc';
  const question = form.theme_config?.questionColor ?? '#f5f5f7';

  return (
    <div
      className="h-40 overflow-hidden relative select-none"
      style={{ backgroundColor: bg }}
    >
      {form.theme_config?.backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${form.theme_config.backgroundImageUrl})` }}
        />
      )}

      <div
        className="absolute inset-0 p-4 flex flex-col justify-center gap-2"
        style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '143%' }}
      >
        <div
          className="h-3 rounded-sm w-4/5"
          style={{ backgroundColor: question, opacity: 0.9 }}
        />
        <div
          className="h-2.5 rounded-sm w-2/3"
          style={{ backgroundColor: question, opacity: 0.5 }}
        />
        <div
          className="h-2 rounded-sm w-1/2 mt-1"
          style={{ backgroundColor: question, opacity: 0.25 }}
        />

        <div
          className="mt-3 h-8 rounded-lg w-full"
          style={{
            backgroundColor: question,
            opacity: 0.08,
            border: `1px solid ${question}30`,
          }}
        />

        <div
          className="mt-2 h-8 rounded-lg w-28 flex items-center justify-center"
          style={{
            backgroundColor: btn,
            borderRadius: `${form.theme_config?.borderRadius ?? 12}px`,
          }}
        >
          <div className="h-2 w-10 rounded-sm bg-white opacity-70" />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-12"
        style={{
          background: `linear-gradient(to bottom, transparent, ${bg}88)`,
        }}
      />
    </div>
  );
}
