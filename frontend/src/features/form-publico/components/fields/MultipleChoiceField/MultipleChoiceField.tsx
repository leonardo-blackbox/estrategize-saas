import { motion } from 'framer-motion';
import type { ApplicationField, ThemeConfig } from '../../../types';
import { getFieldOptions, getOptionFromOptions, hexToRgb, LETTER_KEYS } from '../../../utils/form-publico.helpers';

interface MultipleChoiceFieldProps { field: ApplicationField; value: string[]; onChange: (v: string[]) => void; theme: ThemeConfig; }

export function MultipleChoiceField({ field, value, onChange, theme }: MultipleChoiceFieldProps) {
  const options = getFieldOptions(field);
  const allowMultiple = (getOptionFromOptions(field, 'allowMultiple') as boolean | undefined) || false;
  const buttonColorRgb = hexToRgb(theme.buttonColor);
  const toggle = (optionId: string) => {
    if (allowMultiple) { onChange(value.includes(optionId) ? value.filter((v) => v !== optionId) : [...value, optionId]); }
    else { onChange(value.includes(optionId) ? [] : [optionId]); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 480 }}>
      {options.map((option, idx) => {
        const selected = value.includes(option.id);
        return (
          <motion.button
            key={option.id}
            onClick={() => toggle(option.id)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
              background: selected ? `rgba(${buttonColorRgb}, 0.1)` : 'rgba(255,255,255,0.04)',
              border: selected ? `2px solid ${theme.buttonColor}` : '1px solid rgba(255,255,255,0.12)',
              color: theme.answerColor,
              fontFamily: 'inherit',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                minWidth: 24,
                borderRadius: 6,
                background: selected ? theme.buttonColor : 'rgba(255,255,255,0.08)',
                border: selected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: selected ? theme.buttonTextColor : theme.answerColor,
                fontFamily: 'monospace',
                letterSpacing: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {LETTER_KEYS[idx]?.toUpperCase() ?? idx + 1}
            </span>
            <span style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.4 }}>
              {option.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
