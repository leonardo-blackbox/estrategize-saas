import { type LocalField } from '../../../../stores/editorStore.ts';
import { type ThemeConfig } from '../../../../api/applications.ts';
import { LivePreviewWelcome } from '../LivePreviewWelcome/index.ts';
import { LivePreviewMessage } from '../LivePreviewMessage/index.ts';
import { LivePreviewInputField } from '../LivePreviewInputField/index.ts';
import { LivePreviewLongText } from '../LivePreviewLongText/index.ts';
import { LivePreviewMultipleChoice } from '../LivePreviewMultipleChoice/index.ts';
import { LivePreviewThankYou } from '../LivePreviewThankYou/index.ts';

export function renderFieldPreview(field: LocalField, theme: ThemeConfig) {
  const opts = !Array.isArray(field.options) ? (field.options as Record<string, unknown>) : {};
  const placeholder = (opts.placeholder as string | undefined) ?? undefined;

  switch (field.type) {
    case 'welcome':
      return <LivePreviewWelcome field={field} theme={theme} />;
    case 'message':
      return <LivePreviewMessage field={field} theme={theme} />;
    case 'short_text':
      return <LivePreviewInputField field={field} theme={theme} inputPlaceholder={placeholder ?? 'Resposta curta...'} />;
    case 'long_text':
      return <LivePreviewLongText field={field} theme={theme} />;
    case 'name':
      return <LivePreviewInputField field={field} theme={theme} inputPlaceholder={placeholder ?? 'Seu nome completo...'} />;
    case 'email':
      return <LivePreviewInputField field={field} theme={theme} type="email" inputPlaceholder={placeholder ?? 'email@exemplo.com'} />;
    case 'phone':
      return <LivePreviewInputField field={field} theme={theme} type="tel" inputPlaceholder={placeholder ?? '(11) 99999-9999'} />;
    case 'number':
      return <LivePreviewInputField field={field} theme={theme} type="number" inputPlaceholder={placeholder ?? '0'} />;
    case 'date':
      return <LivePreviewInputField field={field} theme={theme} type="date" />;
    case 'multiple_choice':
      return <LivePreviewMultipleChoice field={field} theme={theme} />;
    case 'thank_you':
      return <LivePreviewThankYou field={field} theme={theme} />;
    default:
      return (
        <div className="flex items-center justify-center h-full opacity-40">
          <span className="text-[13px]">Pre-visualizacao indisponivel</span>
        </div>
      );
  }
}
