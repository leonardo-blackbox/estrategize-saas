import { motion } from 'framer-motion';
import type { ApplicationField, ThemeConfig, FormSettings } from '../../types';
import { getOptionFromOptions } from '../../utils/form-publico.helpers';

interface FormWelcomeStepProps { field: ApplicationField; theme: ThemeConfig; settings: FormSettings; onStart: () => void; }

export function FormWelcomeStep({ field, theme, settings, onStart }: FormWelcomeStepProps) {
  const buttonText = (getOptionFromOptions(field, 'buttonText') as string | undefined) || 'Comecar →';
  const logoPosition = theme.logoPosition === 'center' ? 'center' : theme.logoPosition === 'right' ? 'flex-end' : 'flex-start';
  const containerVariants = { initial: {}, animate: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
  const itemVariants = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } } };

  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '48px 24px' }}
    >
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: logoPosition as 'center' | 'flex-start' | 'flex-end',
          gap: 28, maxWidth: 600, width: '100%',
          textAlign: theme.logoPosition === 'center' ? 'center' : 'left',
        }}
      >
        {theme.logoUrl && (
          <motion.img variants={itemVariants} src={theme.logoUrl} alt="Logo" style={{ height: 48, objectFit: 'contain' }} />
        )}
        <motion.h1 variants={itemVariants} style={{
          fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: theme.questionColor,
          lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0,
        }}>
          {field.title}
        </motion.h1>
        {field.description && (
          <motion.p variants={itemVariants} style={{
            fontSize: 18, color: theme.answerColor, opacity: 0.75, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap',
          }}>
            {field.description}
          </motion.p>
        )}
        {settings.estimatedTime && (
          <motion.p variants={itemVariants} style={{ fontSize: 13, color: theme.answerColor, opacity: 0.45, margin: 0 }}>
            Tempo estimado: {settings.estimatedTime} min
          </motion.p>
        )}
        <motion.button
          variants={itemVariants}
          onClick={onStart}
          whileHover={{ translateY: -2, boxShadow: `0 12px 40px ${theme.buttonColor}99` }}
          whileTap={{ scale: 0.97 }}
          style={{
            height: 56, padding: '0 40px', borderRadius: 16, fontSize: 17, fontWeight: 600,
            color: theme.buttonTextColor, background: theme.buttonColor, border: 'none', cursor: 'pointer',
            boxShadow: `0 8px 32px ${theme.buttonColor}66`, transition: 'box-shadow 0.2s ease', letterSpacing: '-0.01em',
          }}
        >
          {buttonText}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
