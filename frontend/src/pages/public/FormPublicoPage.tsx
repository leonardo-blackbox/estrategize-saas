import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchPublicForm,
  submitFormResponse,
  applicationKeys,
  type ApplicationField,
  type ThemeConfig,
  type FormSettings,
  type FieldOption,
} from '../../api/applications.ts';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function getFieldOptions(field: ApplicationField): FieldOption[] {
  if (Array.isArray(field.options)) return field.options as FieldOption[];
  return [];
}

function getOptionFromOptions(
  field: ApplicationField,
  key: string,
): unknown {
  if (!Array.isArray(field.options)) {
    return (field.options as Record<string, unknown>)[key];
  }
  return undefined;
}

const LETTER_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

// ─────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────

function ProgressBar({
  progress,
  buttonColor,
  visible,
}: {
  progress: number;
  buttonColor: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 100,
        background: 'rgba(255,255,255,0.1)',
      }}
    >
      <motion.div
        style={{
          height: '100%',
          background: buttonColor,
          boxShadow: `0 0 8px ${buttonColor}`,
          originX: 0,
        }}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.4, ease: "easeInOut" as const }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Welcome Screen
// ─────────────────────────────────────────────

function WelcomeScreen({
  field,
  theme,
  settings,
  onStart,
}: {
  field: ApplicationField;
  theme: ThemeConfig;
  settings: FormSettings;
  onStart: () => void;
}) {
  const buttonText =
    (getOptionFromOptions(field, 'buttonText') as string | undefined) ||
    'Começar →';
  const logoPosition =
    theme.logoPosition === 'center'
      ? 'center'
      : theme.logoPosition === 'right'
        ? 'flex-end'
        : 'flex-start';

  const containerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  };
  const itemVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '48px 24px',
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: logoPosition as 'center' | 'flex-start' | 'flex-end',
          gap: 28,
          maxWidth: 600,
          width: '100%',
          textAlign: theme.logoPosition === 'center' ? 'center' : 'left',
        }}
      >
        {theme.logoUrl && (
          <motion.img
            variants={itemVariants}
            src={theme.logoUrl}
            alt="Logo"
            style={{ height: 48, objectFit: 'contain' }}
          />
        )}

        <motion.h1
          variants={itemVariants}
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 700,
            color: theme.questionColor,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {field.title}
        </motion.h1>

        {field.description && (
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: 18,
              color: theme.answerColor,
              opacity: 0.75,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {field.description}
          </motion.p>
        )}

        {settings.estimatedTime && (
          <motion.p
            variants={itemVariants}
            style={{
              fontSize: 13,
              color: theme.answerColor,
              opacity: 0.45,
              margin: 0,
            }}
          >
            Tempo estimado: {settings.estimatedTime} min
          </motion.p>
        )}

        <motion.button
          variants={itemVariants}
          onClick={onStart}
          whileHover={{ translateY: -2, boxShadow: `0 12px 40px ${theme.buttonColor}99` }}
          whileTap={{ scale: 0.97 }}
          style={{
            height: 56,
            padding: '0 40px',
            borderRadius: 16,
            fontSize: 17,
            fontWeight: 600,
            color: theme.buttonTextColor,
            background: theme.buttonColor,
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 8px 32px ${theme.buttonColor}66`,
            transition: 'box-shadow 0.2s ease',
            letterSpacing: '-0.01em',
          }}
        >
          {buttonText}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Thank You Screen
// ─────────────────────────────────────────────

function ThankYouScreen({
  settings,
  theme,
  onReset,
}: {
  settings: FormSettings;
  theme: ThemeConfig;
  onReset: () => void;
}) {
  const containerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const itemVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };
  const checkVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 400, damping: 22, delay: 0.2 },
    },
  };

  return (
    <motion.div
      key="thankyou"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '48px 24px',
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <motion.div
          variants={checkVariants}
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(48, 209, 88, 0.15)',
            border: '2px solid #30d158',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M6 14.5L11.5 20L22 9"
              stroke="#30d158"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            color: theme.questionColor,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {settings.thankYouTitle}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          style={{
            fontSize: 17,
            color: theme.answerColor,
            opacity: 0.7,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {settings.thankYouMessage}
        </motion.p>

        <motion.button
          variants={itemVariants}
          onClick={onReset}
          whileHover={{ opacity: 0.8 }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'transparent',
            border: `1px solid ${theme.buttonColor}66`,
            color: theme.buttonColor,
            padding: '10px 24px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Enviar nova resposta
        </motion.button>

        <motion.p
          variants={itemVariants}
          style={{
            fontSize: 12,
            color: theme.answerColor,
            opacity: 0.25,
            margin: 0,
            marginTop: 16,
          }}
        >
          Feito com Iris ◉
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Field Input Components
// ─────────────────────────────────────────────

const inputBaseStyle = (_buttonColor: string, answerColor: string): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '16px 20px',
  fontSize: 18,
  color: answerColor,
  width: '100%',
  maxWidth: 560,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit',
});

function TextInput({
  field,
  value,
  onChange,
  theme,
  type = 'text',
}: {
  field: ApplicationField;
  value: string;
  onChange: (v: string) => void;
  theme: ThemeConfig;
  type?: React.HTMLInputTypeAttribute;
}) {
  const [focused, setFocused] = useState(false);
  const placeholder =
    (getOptionFromOptions(field, 'placeholder') as string | undefined) || '';

  return (
    <input
      type={type}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBaseStyle(theme.buttonColor, theme.answerColor),
        borderColor: focused ? theme.buttonColor : 'rgba(255,255,255,0.12)',
        boxShadow: focused ? `0 0 0 4px ${theme.buttonColor}33` : 'none',
      }}
    />
  );
}

function TextareaInput({
  field,
  value,
  onChange,
  theme,
}: {
  field: ApplicationField;
  value: string;
  onChange: (v: string) => void;
  theme: ThemeConfig;
}) {
  const [focused, setFocused] = useState(false);
  const placeholder =
    (getOptionFromOptions(field, 'placeholder') as string | undefined) || '';

  return (
    <textarea
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBaseStyle(theme.buttonColor, theme.answerColor),
        borderColor: focused ? theme.buttonColor : 'rgba(255,255,255,0.12)',
        boxShadow: focused ? `0 0 0 4px ${theme.buttonColor}33` : 'none',
        resize: 'vertical',
        minHeight: 120,
      }}
    />
  );
}

function MultipleChoiceInput({
  field,
  value,
  onChange,
  theme,
}: {
  field: ApplicationField;
  value: string[];
  onChange: (v: string[]) => void;
  theme: ThemeConfig;
}) {
  const options = getFieldOptions(field);
  const allowMultiple =
    (getOptionFromOptions(field, 'allowMultiple') as boolean | undefined) || false;
  const buttonColorRgb = hexToRgb(theme.buttonColor);

  const toggle = (optionId: string) => {
    if (allowMultiple) {
      if (value.includes(optionId)) {
        onChange(value.filter((v) => v !== optionId));
      } else {
        onChange([...value, optionId]);
      }
    } else {
      onChange(value.includes(optionId) ? [] : [optionId]);
    }
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
              background: selected
                ? `rgba(${buttonColorRgb}, 0.1)`
                : 'rgba(255,255,255,0.04)',
              border: selected
                ? `2px solid ${theme.buttonColor}`
                : '1px solid rgba(255,255,255,0.12)',
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

function FieldInput({
  field,
  value,
  onChange,
  theme,
}: {
  field: ApplicationField;
  value: unknown;
  onChange: (v: unknown) => void;
  theme: ThemeConfig;
}) {
  const strVal = (value as string) ?? '';
  const arrVal = (value as string[]) ?? [];

  switch (field.type) {
    case 'short_text':
    case 'name':
      return (
        <TextInput
          field={field}
          value={strVal}
          onChange={onChange}
          theme={theme}
        />
      );
    case 'long_text':
      return (
        <TextareaInput
          field={field}
          value={strVal}
          onChange={onChange}
          theme={theme}
        />
      );
    case 'email':
      return (
        <TextInput
          field={field}
          value={strVal}
          onChange={onChange}
          theme={theme}
          type="email"
        />
      );
    case 'phone':
      return (
        <TextInput
          field={field}
          value={strVal}
          onChange={onChange}
          theme={theme}
          type="tel"
        />
      );
    case 'number':
      return (
        <TextInput
          field={field}
          value={strVal}
          onChange={onChange}
          theme={theme}
          type="number"
        />
      );
    case 'date':
      return (
        <TextInput
          field={field}
          value={strVal}
          onChange={onChange}
          theme={theme}
          type="date"
        />
      );
    case 'multiple_choice':
      return (
        <MultipleChoiceInput
          field={field}
          value={arrVal}
          onChange={(v) => onChange(v)}
          theme={theme}
        />
      );
    default:
      return null;
  }
}

// ─────────────────────────────────────────────
// Question Screen
// ─────────────────────────────────────────────

function QuestionScreen({
  field,
  questionNumber,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  totalQuestions: _totalQuestions,
  value,
  onChange,
  onNext,
  onBack,
  theme,
  settings,
  isLast,
  isMutating,
  direction,
}: {
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
  direction: 'forward' | 'back';
}) {
  const xOffset = direction === 'forward' ? 40 : -40;
  const isMessage = field.type === 'message';
  const hasValue =
    isMessage ||
    (Array.isArray(value) ? (value as string[]).length > 0 : Boolean(value));
  const canProceed = !field.required || hasValue;

  return (
    <motion.div
      key={field.id}
      initial={{ opacity: 0, x: xOffset }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -xOffset }}
      transition={{ duration: 0.35, ease: "easeOut" as const }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '80px 24px 120px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 640,
          width: '100%',
          marginTop: '-5vh',
        }}
      >
        {/* Question number */}
        {settings.showQuestionNumbers && !isMessage && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: 600,
              color: theme.buttonColor,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ opacity: 0.7 }}>
              {String(questionNumber).padStart(2, '0')}
            </span>
            <motion.span
              initial={{ x: -4, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.25 }}
            >
              →
            </motion.span>
          </motion.div>
        )}

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" as const }}
          style={{
            fontSize: 'clamp(22px, 4vw, 34px)',
            fontWeight: 600,
            color: theme.questionColor,
            margin: 0,
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          {field.title}
          {field.required && (
            <span style={{ color: theme.buttonColor, marginLeft: 4 }}>*</span>
          )}
        </motion.h2>

        {/* Description */}
        {field.description && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            style={{
              fontSize: 15,
              color: theme.answerColor,
              opacity: 0.7,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {field.description}
          </motion.p>
        )}

        {/* Field */}
        {!isMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.35, ease: "easeOut" as const }}
          >
            <FieldInput
              field={field}
              value={value}
              onChange={onChange}
              theme={theme}
            />
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
        >
          <motion.button
            onClick={onNext}
            disabled={!canProceed || isMutating}
            whileHover={canProceed ? { translateY: -2 } : {}}
            whileTap={canProceed ? { scale: 0.97 } : {}}
            style={{
              height: 48,
              padding: '0 28px',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              color: canProceed ? theme.buttonTextColor : theme.answerColor,
              background: canProceed ? theme.buttonColor : 'rgba(255,255,255,0.06)',
              border: canProceed ? 'none' : '1px solid rgba(255,255,255,0.1)',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              opacity: canProceed ? 1 : 0.45,
              boxShadow: canProceed ? `0 6px 20px ${theme.buttonColor}55` : 'none',
              transition: 'background 0.15s, box-shadow 0.15s, opacity 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isMutating ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SpinnerIcon size={16} color={theme.buttonTextColor} />
                Enviando...
              </span>
            ) : isLast ? (
              'Enviar'
            ) : (
              <>
                OK <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>↵</span>
              </>
            )}
          </motion.button>

          {!isMessage && canProceed && !isLast && (
            <span
              style={{
                fontSize: 12,
                color: theme.answerColor,
                opacity: 0.35,
                fontFamily: 'monospace',
              }}
            >
              pressione Enter ↵
            </span>
          )}

          {questionNumber > 1 && (
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.answerColor,
                opacity: 0.4,
                cursor: 'pointer',
                fontSize: 13,
                padding: '4px 8px',
              }}
            >
              ← Voltar
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Loading / Error Screens
// ─────────────────────────────────────────────

function SpinnerIcon({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

function LoadingScreen() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <SpinnerIcon size={32} color="rgba(255,255,255,0.5)" />
    </motion.div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 12,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(255,69,58,0.12)',
          border: '1.5px solid rgba(255,69,58,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
      >
        ✕
      </div>
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
        {message}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
        Verifique se o link está correto ou contate o criador do formulário.
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function FormPublicoPage() {
  const { slug } = useParams<{ slug: string }>();

  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: applicationKeys.public(slug ?? ''),
    queryFn: () => fetchPublicForm(slug!),
    enabled: Boolean(slug),
    retry: 1,
  });

  const submitMutation = useMutation({
    mutationFn: ({
      answersArr,
    }: {
      answersArr: Array<{ field_id: string; value: unknown }>;
    }) => submitFormResponse(slug!, answersArr),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const fields = data?.fields ?? [];
  const application = data?.application;
  const theme = application?.theme_config ?? {
    backgroundColor: '#000000',
    questionColor: '#f5f5f7',
    answerColor: '#f5f5f7',
    buttonColor: '#7c5cfc',
    buttonTextColor: '#ffffff',
    fontFamily: 'Inter',
    borderRadius: 12,
    logoPosition: 'left' as const,
  };
  const settings = application?.settings ?? {
    limitOneResponsePerSession: false,
    showProgressBar: true,
    showQuestionNumbers: true,
    thankYouTitle: 'Obrigado!',
    thankYouMessage: 'Suas respostas foram recebidas.',
  };

  // Collectible fields (not welcome / message / thank_you)
  const collectibleFields = fields.filter(
    (f) => f.type !== 'welcome' && f.type !== 'message' && f.type !== 'thank_you',
  );

  // Progress calculation
  const answeredCount = collectibleFields.filter((f) => {
    const v = answers[f.id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;
  const progress =
    collectibleFields.length > 0 ? answeredCount / collectibleFields.length : 0;

  const currentField = fields[currentIndex] ?? null;

  // Question number within collectible fields
  const collectibleIndex = currentField
    ? collectibleFields.findIndex((f) => f.id === currentField.id)
    : -1;
  const questionNumber = collectibleIndex + 1;

  // Determine if current field is the last before submit
  const lastQuestionableIndex = (() => {
    for (let i = fields.length - 1; i >= 0; i--) {
      const f = fields[i];
      if (f.type !== 'welcome' && f.type !== 'thank_you') return i;
    }
    return -1;
  })();
  const isLastQuestion = currentIndex === lastQuestionableIndex;

  const handleSetAnswer = useCallback(
    (fieldId: string, value: unknown) => {
      setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (!currentField) {
      // Welcome screen: find first non-welcome field
      const firstIdx = fields.findIndex((f) => f.type !== 'welcome');
      setDirection('forward');
      setCurrentIndex(firstIdx >= 0 ? firstIdx : 0);
      return;
    }

    // Validate required
    if (
      currentField.required &&
      currentField.type !== 'message' &&
      currentField.type !== 'welcome'
    ) {
      const v = answers[currentField.id];
      const hasValue = Array.isArray(v) ? v.length > 0 : Boolean(v);
      if (!hasValue) return;
    }

    if (isLastQuestion) {
      // Submit
      const answersArr = collectibleFields
        .filter((f) => answers[f.id] !== undefined)
        .map((f) => ({ field_id: f.id, value: answers[f.id] }));
      submitMutation.mutate({ answersArr });
      return;
    }

    setDirection('forward');
    setCurrentIndex((prev) => Math.min(prev + 1, fields.length - 1));
  }, [currentField, fields, answers, isLastQuestion, collectibleFields, submitMutation]);

  const handleBack = useCallback(() => {
    if (currentIndex <= 0) return;
    setDirection('back');
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, [currentIndex]);

  const handleReset = useCallback(() => {
    setCurrentIndex(-1);
    setAnswers({});
    setSubmitted(false);
    setDirection('forward');
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (submitted) return;

      // Don't intercept when typing in inputs/textareas
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === 'Enter') {
        if (isInput && target.tagName === 'TEXTAREA') return; // allow newline in textarea
        e.preventDefault();
        handleNext();
        return;
      }

      // Multiple choice letter keys
      if (currentField?.type === 'multiple_choice' && !isInput) {
        const idx = LETTER_KEYS.indexOf(e.key.toLowerCase());
        if (idx >= 0) {
          const options = getFieldOptions(currentField);
          const option = options[idx];
          if (!option) return;
          const allowMultiple =
            (getOptionFromOptions(currentField, 'allowMultiple') as boolean) || false;
          setAnswers((prev) => {
            const current = (prev[currentField.id] as string[]) ?? [];
            if (allowMultiple) {
              const newVal = current.includes(option.id)
                ? current.filter((v) => v !== option.id)
                : [...current, option.id];
              return { ...prev, [currentField.id]: newVal };
            } else {
              const newVal = current.includes(option.id) ? [] : [option.id];
              return { ...prev, [currentField.id]: newVal };
            }
          });
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [submitted, currentField, handleNext]);

  // Welcome field (first field with type 'welcome')
  const welcomeField = fields.find((f) => f.type === 'welcome');
  const welcomeIndex = welcomeField ? fields.indexOf(welcomeField) : -1;

  // Determine what to render
  const renderContent = () => {
    if (isLoading) return <LoadingScreen />;
    if (isError || !data) return <ErrorScreen message="Formulário não encontrado" />;
    if (submitted) {
      return (
        <ThankYouScreen
          settings={settings}
          theme={theme}
          onReset={handleReset}
        />
      );
    }
    if (currentIndex === -1) {
      // Before start: show welcome or loading
      if (!welcomeField) {
        // No welcome field, auto-start
        return <LoadingScreen />;
      }
      return (
        <WelcomeScreen
          field={welcomeField}
          theme={theme}
          settings={settings}
          onStart={() => {
            setDirection('forward');
            const firstNonWelcome = fields.findIndex(
              (f, i) => i > welcomeIndex && f.type !== 'welcome',
            );
            setCurrentIndex(firstNonWelcome >= 0 ? firstNonWelcome : 0);
          }}
        />
      );
    }
    if (!currentField) return null;
    if (currentField.type === 'welcome') {
      return (
        <WelcomeScreen
          field={currentField}
          theme={theme}
          settings={settings}
          onStart={handleNext}
        />
      );
    }
    if (currentField.type === 'thank_you') {
      return <ThankYouScreen settings={settings} theme={theme} onReset={handleReset} />;
    }
    return (
      <QuestionScreen
        field={currentField}
        questionNumber={questionNumber}
        totalQuestions={collectibleFields.length}
        value={answers[currentField.id]}
        onChange={(v) => handleSetAnswer(currentField.id, v)}
        onNext={handleNext}
        onBack={handleBack}
        theme={theme}
        settings={settings}
        isLast={isLastQuestion}
        isMutating={submitMutation.isPending}
        direction={direction}
      />
    );
  };

  // Auto-start if no welcome field
  useEffect(() => {
    if (!isLoading && data && !welcomeField && currentIndex === -1) {
      const first = fields.findIndex(
        (f) => f.type !== 'welcome' && f.type !== 'thank_you',
      );
      setCurrentIndex(first >= 0 ? first : 0);
    }
  }, [isLoading, data, welcomeField, currentIndex, fields]);

  const bgStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: theme.backgroundColor,
    fontFamily: theme.fontFamily || 'Inter, sans-serif',
    overflow: 'hidden auto',
  };

  if (theme.backgroundImageUrl) {
    Object.assign(bgStyle, {
      backgroundImage: `url(${theme.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    });
  }

  return (
    <div ref={containerRef} style={bgStyle}>
      <ProgressBar
        progress={progress}
        buttonColor={theme.buttonColor}
        visible={settings.showProgressBar && !submitted && currentIndex >= 0}
      />
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  );
}
