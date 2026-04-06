import { useState } from 'react';
import type { ApplicationField, ThemeConfig } from '../../../types';
import { inputBaseStyle } from '../../../utils/form-publico.helpers';

interface PhoneInputFieldProps {
  field: ApplicationField;
  value: string;
  onChange: (v: string) => void;
  theme: ThemeConfig;
}

function applyPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function PhoneInputField({ field, value, onChange, theme }: PhoneInputFieldProps) {
  const [focused, setFocused] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyPhoneMask(e.target.value);
    onChange(masked);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <span style={{
        display: 'flex', alignItems: 'center', padding: '0 12px',
        alignSelf: 'stretch', background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${focused ? theme.buttonColor : 'rgba(255,255,255,0.12)'}`,
        borderRight: 'none', borderRadius: '12px 0 0 12px',
        color: theme.answerColor, fontSize: 16, fontWeight: 500,
        whiteSpace: 'nowrap', userSelect: 'none',
        boxShadow: focused ? `0 0 0 4px ${theme.buttonColor}33` : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
        🇧🇷 +55
      </span>
      <input
        type="tel"
        inputMode="numeric"
        autoFocus
        value={value}
        onChange={handleChange}
        placeholder="(11) 99999-9999"
        aria-label={field.title}
        aria-required={field.required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputBaseStyle(theme.buttonColor, theme.answerColor),
          borderColor: focused ? theme.buttonColor : 'rgba(255,255,255,0.12)',
          boxShadow: focused ? `0 0 0 4px ${theme.buttonColor}33` : 'none',
          fontSize: 18,
          borderRadius: '0 12px 12px 0',
          flex: 1,
        }}
      />
    </div>
  );
}
