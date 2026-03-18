import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore, type LocalField } from '../../../stores/editorStore.ts';
import { type ThemeConfig, type FieldOption } from '../../../api/applications.ts';
import { cn } from '../../../lib/cn.ts';

// ─────────────────────────────────────────────
// Field renderers
// ─────────────────────────────────────────────

interface FieldPreviewProps {
  field: LocalField;
  theme: ThemeConfig;
  isActive: boolean;
}

function WelcomePreview({ field, theme }: FieldPreviewProps) {
  const opts = field.options as Record<string, unknown>;
  const description = (opts.description as string) ?? field.description ?? '';
  const buttonText = (opts.buttonText as string) ?? 'Começar';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
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

function MessagePreview({ field, theme }: FieldPreviewProps) {
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

function InputFieldPreview({ field, theme, inputPlaceholder, type = 'text' }: FieldPreviewProps & { inputPlaceholder?: string; type?: string }) {
  return (
    <div className="flex flex-col justify-center h-full gap-5 px-8">
      <div className="flex flex-col gap-2">
        <label
          className="text-[18px] font-semibold leading-snug"
          style={{ color: theme.questionColor, fontFamily: theme.fontFamily }}
        >
          {field.title}
          {field.required && (
            <span className="ml-1 text-[#ff453a] text-[14px]">*</span>
          )}
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
      <input
        type={type}
        placeholder={inputPlaceholder ?? 'Sua resposta...'}
        disabled
        className="w-full outline-none bg-transparent border-b-2 pb-2 text-[15px] pointer-events-none"
        style={{
          color: theme.answerColor,
          borderColor: `${theme.answerColor}40`,
          fontFamily: theme.fontFamily,
          caretColor: theme.buttonColor,
        }}
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
        OK →
      </button>
    </div>
  );
}

function LongTextPreview({ field, theme }: FieldPreviewProps) {
  const opts = !Array.isArray(field.options) ? (field.options as Record<string, unknown>) : {};
  const placeholder = (opts.placeholder as string | undefined) ?? 'Sua resposta...';

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
          <p className="text-[13px] opacity-60" style={{ color: theme.questionColor, fontFamily: theme.fontFamily, whiteSpace: 'pre-wrap' }}>
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
        style={{ background: theme.buttonColor, color: theme.buttonTextColor, borderRadius: `${theme.borderRadius}px`, fontFamily: theme.fontFamily }}
      >
        OK →
      </button>
    </div>
  );
}

function MultipleChoicePreview({ field, theme }: FieldPreviewProps) {
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
          <p className="text-[13px] opacity-60" style={{ color: theme.questionColor, fontFamily: theme.fontFamily, whiteSpace: 'pre-wrap' }}>
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
            Nenhuma opção configurada
          </p>
        )}
      </div>
    </div>
  );
}

function ThankYouPreview({ field, theme }: FieldPreviewProps) {
  const opts = field.options as Record<string, unknown>;
  const message = (opts.message as string) ?? 'Suas respostas foram recebidas.';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-[28px]"
        style={{ background: `${theme.buttonColor}20` }}
      >
        <span style={{ color: theme.buttonColor }}>✓</span>
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

// ─────────────────────────────────────────────
// renderFieldPreview dispatcher
// ─────────────────────────────────────────────

function renderFieldPreview(field: LocalField, theme: ThemeConfig, isActive: boolean) {
  const props: FieldPreviewProps = { field, theme, isActive };
  const opts = !Array.isArray(field.options) ? (field.options as Record<string, unknown>) : {};
  const placeholder = (opts.placeholder as string | undefined) ?? undefined;

  switch (field.type) {
    case 'welcome':
      return <WelcomePreview {...props} />;
    case 'message':
      return <MessagePreview {...props} />;
    case 'short_text':
      return <InputFieldPreview {...props} inputPlaceholder={placeholder ?? 'Resposta curta...'} />;
    case 'long_text':
      return <LongTextPreview {...props} />;
    case 'name':
      return <InputFieldPreview {...props} inputPlaceholder={placeholder ?? 'Seu nome completo...'} />;
    case 'email':
      return <InputFieldPreview {...props} type="email" inputPlaceholder={placeholder ?? 'email@exemplo.com'} />;
    case 'phone':
      return <InputFieldPreview {...props} type="tel" inputPlaceholder={placeholder ?? '(11) 99999-9999'} />;
    case 'number':
      return <InputFieldPreview {...props} type="number" inputPlaceholder={placeholder ?? '0'} />;
    case 'date':
      return <InputFieldPreview {...props} type="date" />;
    case 'multiple_choice':
      return <MultipleChoicePreview {...props} />;
    case 'thank_you':
      return <ThankYouPreview {...props} />;
    default:
      return (
        <div className="flex items-center justify-center h-full opacity-40">
          <span className="text-[13px]">Pré-visualização indisponível</span>
        </div>
      );
  }
}

// ─────────────────────────────────────────────
// Device toggle button
// ─────────────────────────────────────────────

interface DeviceToggleProps {
  device: 'desktop' | 'mobile';
  onChange: (d: 'desktop' | 'mobile') => void;
}

function DeviceToggle({ device, onChange }: DeviceToggleProps) {
  return (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      {(['desktop', 'mobile'] as const).map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={cn(
            'px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150',
            device === d
              ? 'bg-[rgba(255,255,255,0.12)] text-white'
              : 'text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.7)]',
          )}
        >
          {d === 'desktop' ? '🖥' : '📱'}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// LivePreviewPanel
// ─────────────────────────────────────────────

export function LivePreviewPanel() {
  const { fields, selectedFieldIndex, selectField, themeConfig, previewDevice, setPreviewDevice } =
    useEditorStore();

  const currentField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : fields[0];
  const currentIndex = selectedFieldIndex !== null ? selectedFieldIndex : 0;
  const totalFields = fields.length;

  const isDesktop = previewDevice === 'desktop';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#1c1c1e',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span className="text-[12px] font-medium text-[rgba(255,255,255,0.4)] uppercase tracking-wider">
          Pré-visualização
        </span>
        {totalFields > 0 && (
          <span className="text-[12px] text-[rgba(255,255,255,0.4)]">
            Campo {currentIndex + 1} de {totalFields}
          </span>
        )}
        <DeviceToggle device={previewDevice} onChange={setPreviewDevice} />
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center gap-3 opacity-30">
            <span className="text-[40px]">📋</span>
            <p className="text-[13px] text-white">Adicione campos para visualizar</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${previewDevice}-${currentIndex}`}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: isDesktop ? '90%' : '375px',
                maxWidth: isDesktop ? '720px' : '375px',
                height: isDesktop ? '90%' : '667px',
                maxHeight: isDesktop ? 'calc(100% - 40px)' : '667px',
                borderRadius: isDesktop ? 16 : 44,
                background: themeConfig.backgroundColor,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Active field ring */}
              {currentField && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    boxShadow: 'inset 0 0 0 2px rgba(124,92,252,0.4)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )}

              {/* Field content */}
              <div style={{ height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
                {currentField
                  ? renderFieldPreview(currentField, themeConfig, true)
                  : (
                    <div className="flex items-center justify-center h-full opacity-30">
                      <span className="text-[13px] text-white">Nenhum campo selecionado</span>
                    </div>
                  )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Navigation toolbar */}
        {totalFields > 1 && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
            style={{ zIndex: 20 }}
          >
            <div
              className="flex items-center gap-1 px-1.5 py-1.5 rounded-full"
              style={{
                background: 'rgba(30,30,32,0.9)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              <button
                disabled={currentIndex === 0}
                onClick={() => selectField(Math.max(0, currentIndex - 1))}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all',
                  currentIndex === 0
                    ? 'text-[rgba(255,255,255,0.2)] pointer-events-none'
                    : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]',
                )}
              >
                ← Anterior
              </button>

              <div className="w-px h-4 bg-[rgba(255,255,255,0.12)] mx-0.5" />

              <button
                disabled={currentIndex === totalFields - 1}
                onClick={() => selectField(Math.min(totalFields - 1, currentIndex + 1))}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all',
                  currentIndex === totalFields - 1
                    ? 'text-[rgba(255,255,255,0.2)] pointer-events-none'
                    : 'text-[rgba(255,255,255,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]',
                )}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
