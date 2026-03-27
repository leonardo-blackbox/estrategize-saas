import { motion } from 'framer-motion';
import type { ThemeConfig, FormSettings } from '../../types';

interface FormThankYouStepProps {
  settings: FormSettings;
  theme: ThemeConfig;
  onReset: () => void;
  redirectCountdown?: number | null;
}

export function FormThankYouStep({ settings, theme, onReset, redirectCountdown }: FormThankYouStepProps) {
  const containerVariants = { initial: {}, animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };
  const itemVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };
  const checkVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 22, delay: 0.2 } },
  };

  return (
    <motion.div key="thankyou" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '48px 24px' }}>
      <motion.div variants={containerVariants} initial="initial" animate="animate"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <motion.div variants={checkVariants} style={{
          width: 64, height: 64, borderRadius: 20, background: 'rgba(48, 209, 88, 0.15)',
          border: '2px solid #30d158', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14.5L11.5 20L22 9" stroke="#30d158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
        <motion.h1 variants={itemVariants} style={{
          fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: theme.questionColor, margin: 0, letterSpacing: '-0.02em',
        }}>
          {settings.thankYouTitle}
        </motion.h1>
        <motion.p variants={itemVariants} style={{ fontSize: 17, color: theme.answerColor, opacity: 0.7, margin: 0, lineHeight: 1.6 }}>
          {settings.thankYouMessage}
        </motion.p>
        {settings.redirectUrl && redirectCountdown !== null && redirectCountdown !== undefined && (
          <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <p style={{ fontSize: 13, color: theme.answerColor, opacity: 0.5, margin: 0 }}>
              Redirecionando em {redirectCountdown}s...
            </p>
            <button onClick={() => { window.location.href = settings.redirectUrl!; }} style={{
              background: theme.buttonColor, color: theme.buttonTextColor, border: 'none',
              padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Ir agora →
            </button>
          </motion.div>
        )}
        <motion.button variants={itemVariants} onClick={onReset} whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.97 }} style={{
          background: 'transparent', border: `1px solid ${theme.buttonColor}66`, color: theme.buttonColor,
          padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer',
        }}>
          Enviar nova resposta
        </motion.button>
        <motion.p variants={itemVariants} style={{ fontSize: 12, color: theme.answerColor, opacity: 0.25, margin: 0, marginTop: 16 }}>
          Feito com Iris ◉
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
