import { type LocalField } from '../../../../stores/editorStore.ts';
import { FIELD_TYPE_META, TYPE_BADGE_COLORS } from '../FieldOptionsShared/index.ts';
import { FieldOptionsWelcome } from '../FieldOptionsWelcome/index.ts';
import { FieldOptionsThankYou } from '../FieldOptionsThankYou/index.ts';
import { FieldOptionsMessage } from '../FieldOptionsMessage/index.ts';
import { FieldOptionsMultipleChoice } from '../FieldOptionsMultipleChoice/index.ts';
import { FieldOptionsShortText } from '../FieldOptionsShortText/index.ts';
import { FieldOptionsLongText } from '../FieldOptionsLongText/index.ts';
import { FieldOptionsName } from '../FieldOptionsName/index.ts';
import { FieldOptionsEmail } from '../FieldOptionsEmail/index.ts';
import { FieldOptionsPhone } from '../FieldOptionsPhone/index.ts';
import { FieldOptionsNumber } from '../FieldOptionsNumber/index.ts';
import { FieldOptionsDate } from '../FieldOptionsDate/index.ts';

interface FieldSettingsProps {
  field: LocalField;
  index: number;
}

export function FieldSettings({ field, index }: FieldSettingsProps) {
  const meta = FIELD_TYPE_META[field.type];
  const color = TYPE_BADGE_COLORS[field.type] ?? { bg: 'rgba(110,110,115,0.12)', text: '#8e8e93' };

  const renderBody = () => {
    switch (field.type) {
      case 'welcome':
        return <FieldOptionsWelcome field={field} index={index} />;
      case 'thank_you':
        return <FieldOptionsThankYou field={field} index={index} />;
      case 'message':
        return <FieldOptionsMessage field={field} index={index} />;
      case 'multiple_choice':
        return <FieldOptionsMultipleChoice field={field} index={index} />;
      case 'short_text':
        return <FieldOptionsShortText field={field} index={index} />;
      case 'long_text':
        return <FieldOptionsLongText field={field} index={index} />;
      case 'name':
        return <FieldOptionsName field={field} index={index} />;
      case 'email':
        return <FieldOptionsEmail field={field} index={index} />;
      case 'phone':
        return <FieldOptionsPhone field={field} index={index} />;
      case 'number':
        return <FieldOptionsNumber field={field} index={index} />;
      case 'date':
        return <FieldOptionsDate field={field} index={index} />;
      default:
        return <FieldOptionsShortText field={field} index={index} />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
      <div className="flex-1 overflow-y-auto">{renderBody()}</div>
    </div>
  );
}
