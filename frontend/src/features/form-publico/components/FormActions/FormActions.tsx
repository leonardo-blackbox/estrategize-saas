import { motion } from 'framer-motion';
import type { ThemeConfig } from '../../types';
import { SpinnerIcon } from '../SpinnerIcon';

interface FormActionsProps {
  canProceed: boolean;
  isMutating: boolean;
  isLast: boolean;
  isMessage: boolean;
  isTouchDevice?: boolean;
  questionNumber: number;
  buttonLabel?: string;
  theme: ThemeConfig;
  onNext: () => void;
  onBack: () => void;
}

export function FormActions({
  canProceed, isMutating, isLast, isMessage, isTouchDevice,
  questionNumber, buttonLabel, theme, onNext, onBack,
}: FormActionsProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.3 }}
      style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <motion.button onClick={onNext} disabled={!canProceed || isMutating}
        whileHover={canProceed ? { translateY: -2 } : {}} whileTap={canProceed ? { scale: 0.97 } : {}}
        style={{
          height: 48, padding: '0 28px', borderRadius: 12, fontSize: 15, fontWeight: 600,
          color: canProceed ? theme.buttonTextColor : theme.answerColor,
          background: canProceed ? theme.buttonColor : 'rgba(255,255,255,0.06)',
          border: canProceed ? 'none' : '1px solid rgba(255,255,255,0.1)',
          cursor: canProceed ? 'pointer' : 'not-allowed', opacity: canProceed ? 1 : 0.45,
          boxShadow: canProceed ? `0 6px 20px ${theme.buttonColor}55` : 'none',
          transition: 'background 0.15s, box-shadow 0.15s, opacity 0.15s',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
        {isMutating ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SpinnerIcon size={16} color={theme.buttonTextColor} />Enviando...
          </span>
        ) : isLast ? 'Enviar' : <>{buttonLabel || 'OK'} <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>↵</span></>}
      </motion.button>
      {!isMessage && canProceed && !isLast && !isTouchDevice && (
        <span style={{ fontSize: 12, color: theme.answerColor, opacity: 0.35, fontFamily: 'monospace' }}>pressione Enter ↵</span>
      )}
      {questionNumber > 1 && (
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: theme.answerColor, opacity: 0.4, cursor: 'pointer', fontSize: 13, padding: '4px 8px' }}>
          ← Voltar
        </button>
      )}
    </motion.div>
  );
}
