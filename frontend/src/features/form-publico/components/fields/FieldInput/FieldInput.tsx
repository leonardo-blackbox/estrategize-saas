import type { ApplicationField, ThemeConfig } from '../../../types';
import { TextInputField } from '../TextInputField';
import { TextareaInputField } from '../TextareaInputField';
import { MultipleChoiceField } from '../MultipleChoiceField';

interface FieldInputProps {
  field: ApplicationField;
  value: unknown;
  onChange: (v: unknown) => void;
  theme: ThemeConfig;
}

export function FieldInput({ field, value, onChange, theme }: FieldInputProps) {
  const strVal = (value as string) ?? '';
  const arrVal = (value as string[]) ?? [];

  switch (field.type) {
    case 'short_text':
    case 'name':
      return <TextInputField field={field} value={strVal} onChange={onChange} theme={theme} />;
    case 'long_text':
      return <TextareaInputField field={field} value={strVal} onChange={onChange} theme={theme} />;
    case 'email':
      return <TextInputField field={field} value={strVal} onChange={onChange} theme={theme} type="email" />;
    case 'phone':
      return <TextInputField field={field} value={strVal} onChange={onChange} theme={theme} type="tel" />;
    case 'number':
      return <TextInputField field={field} value={strVal} onChange={onChange} theme={theme} type="number" />;
    case 'date':
      return <TextInputField field={field} value={strVal} onChange={onChange} theme={theme} type="date" />;
    case 'multiple_choice':
      return <MultipleChoiceField field={field} value={arrVal} onChange={(v) => onChange(v)} theme={theme} />;
    default:
      return null;
  }
}
