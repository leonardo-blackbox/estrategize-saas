import { motion } from 'framer-motion';
import type { ApplicationField, ThemeConfig, FormSettings, Direction } from '../../types';
import { getOptionFromOptions } from '../../utils/form-publico.helpers';
import { FieldInput } from '../fields';
import { FormActions } from '../FormActions';

interface FormQuestionStepProps {
  field: ApplicationField;
  questionNumber: number;
  totalQuestions: number;
  value: unknown;
  onChange: (v: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  theme: ThemeConfig;
  settings: FormSettings;
  isLast: boolean;
  isMutating: boolean;
  direction: Direction;
  validationError?: string | null;
  onClearError?: () => void;
  isTouchDevice?: boolean;
  buttonLabel?: string;
}

export function FormQuestionStep({
  field, questionNumber, value, onChange, onNext, onBack,
  theme, settings, isLast, isMutating, direction,
  validationError, onClearError, isTouchDevice, buttonLabel,
}: FormQuestionStepProps) {
  const xOffset = direction === 'forward' ? 40 : -40;
  const isMessage = field.type === 'message';
  const hasValue = isMessage || (Array.isArray(value) ? (value as string[]).length > 0 : Boolean(value));
  const canProceed = !field.required || hasValue;
  const maxLength = getOptionFromOptions(field, 'maxLength') as number | undefined;
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <motion.div key={field.id} initial={{ opacity: 0, x: xOffset }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -xOffset }} transition={{ duration: 0.35, ease: "easeOut" as const }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px 120px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, width: '100%', marginTop: '-5vh' }}>
        {settings.showQuestionNumbers && !isMessage && (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05, duration: 0.3 }}
            style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: theme.buttonColor, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ opacity: 0.7 }}>{String(questionNumber).padStart(2, '0')}</span>
            <motion.span initial={{ x: -4, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.25 }}>→</motion.span>
          </motion.div>
        )}
        <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" as const }}
          style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 600, color: theme.questionColor, margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
          {field.title}{field.required && <span style={{ color: theme.buttonColor, marginLeft: 4 }}>*</span>}
        </motion.h2>
        {field.description && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.3 }}
            style={{ fontSize: 15, color: theme.answerColor, opacity: 0.7, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {field.description}
          </motion.p>
        )}
        {!isMessage && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.35, ease: "easeOut" as const }}>
            <FieldInput field={field} value={value} onChange={(v) => { onChange(v); onClearError?.(); }} theme={theme} />
            {validationError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#ff453a', fontSize: 13, margin: 0, marginTop: 8 }} role="alert" aria-live="polite">
                {validationError}
              </motion.p>
            )}
            {maxLength && (
              <p style={{ fontSize: 12, color: charCount >= maxLength * 0.9 ? '#ff453a' : theme.answerColor, opacity: charCount >= maxLength * 0.9 ? 1 : 0.4, margin: 0, marginTop: 4, textAlign: 'right', maxWidth: 560 }}>
                {charCount}/{maxLength}
              </p>
            )}
          </motion.div>
        )}
        <FormActions canProceed={canProceed} isMutating={isMutating} isLast={isLast} isMessage={isMessage}
          isTouchDevice={isTouchDevice} questionNumber={questionNumber} buttonLabel={buttonLabel} theme={theme} onNext={onNext} onBack={onBack} />
      </div>
    </motion.div>
  );
}
