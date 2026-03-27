import { useState } from 'react';
import type { ApplicationField, ThemeConfig } from '../../../types';
import { getOptionFromOptions, inputBaseStyle } from '../../../utils/form-publico.helpers';

interface TextareaInputFieldProps {
  field: ApplicationField;
  value: string;
  onChange: (v: string) => void;
  theme: ThemeConfig;
}

export function TextareaInputField({ field, value, onChange, theme }: TextareaInputFieldProps) {
  const [focused, setFocused] = useState(false);
  const placeholder = (getOptionFromOptions(field, 'placeholder') as string | undefined) || '';
  const maxLength = getOptionFromOptions(field, 'maxLength') as number | undefined;

  return (
    <textarea
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={4}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label={field.title}
      aria-required={field.required}
      style={{
        ...inputBaseStyle(theme.buttonColor, theme.answerColor),
        borderColor: focused ? theme.buttonColor : 'rgba(255,255,255,0.12)',
        boxShadow: focused ? `0 0 0 4px ${theme.buttonColor}33` : 'none',
        resize: 'vertical',
        minHeight: 120,
        fontSize: 18,
      }}
    />
  );
}
