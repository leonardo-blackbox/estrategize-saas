import { useState } from 'react';
import type { ApplicationField, ThemeConfig } from '../../../types';
import { getOptionFromOptions, inputBaseStyle } from '../../../utils/form-publico.helpers';

interface TextInputFieldProps {
  field: ApplicationField;
  value: string;
  onChange: (v: string) => void;
  theme: ThemeConfig;
  type?: React.HTMLInputTypeAttribute;
}

export function TextInputField({ field, value, onChange, theme, type = 'text' }: TextInputFieldProps) {
  const [focused, setFocused] = useState(false);
  const placeholder = (getOptionFromOptions(field, 'placeholder') as string | undefined) || '';
  const maxLength = getOptionFromOptions(field, 'maxLength') as number | undefined;
  const min = getOptionFromOptions(field, 'min') as number | undefined;
  const max = getOptionFromOptions(field, 'max') as number | undefined;
  const minDate = getOptionFromOptions(field, 'minDate') as string | undefined;
  const maxDate = getOptionFromOptions(field, 'maxDate') as string | undefined;

  return (
    <input
      type={type}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      min={type === 'number' ? min : type === 'date' ? minDate : undefined}
      max={type === 'number' ? max : type === 'date' ? maxDate : undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label={field.title}
      aria-required={field.required}
      style={{
        ...inputBaseStyle(theme.buttonColor, theme.answerColor),
        borderColor: focused ? theme.buttonColor : 'rgba(255,255,255,0.12)',
        boxShadow: focused ? `0 0 0 4px ${theme.buttonColor}33` : 'none',
        fontSize: 18,
      }}
    />
  );
}
