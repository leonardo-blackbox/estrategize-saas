import { motion } from 'framer-motion';

interface FormProgressBarProps {
  progress: number;
  buttonColor: string;
  visible: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
}

export function FormProgressBar({ progress, buttonColor, visible, currentQuestion, totalQuestions }: FormProgressBarProps) {
  if (!visible) return null;
  return (
    <>
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
      {currentQuestion !== undefined && totalQuestions !== undefined && totalQuestions > 0 && (
        <div style={{
          position: 'fixed',
          top: 8,
          right: 16,
          fontSize: 11,
          color: buttonColor,
          opacity: 0.6,
          fontFamily: 'monospace',
          fontWeight: 600,
          zIndex: 101,
        }}>
          {currentQuestion} / {totalQuestions}
        </div>
      )}
    </>
  );
}
