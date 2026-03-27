import { motion } from 'framer-motion';

interface FormErrorProps {
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, padding: 24, textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: 'rgba(255,69,58,0.12)',
        border: '1.5px solid rgba(255,69,58,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      }}>
        ✕
      </div>
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{message}</p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
        Verifique se o link está correto ou contate o criador do formulário.
      </p>
    </motion.div>
  );
}
