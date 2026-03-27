import { motion } from 'framer-motion';

export function FormLoading() {
  return (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '48px 24px', gap: 20 }}>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
      {[{ w: '60%', h: 40 }, { w: '40%', h: 20 }, { w: '50%', h: 20 }, { w: '180px', h: 48, br: 12 }].map((s, i) => (
        <div key={i} style={{
          width: s.w, height: s.h, borderRadius: s.br ?? 8,
          background: 'rgba(255,255,255,0.08)',
          animation: `skeleton-pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
        }} />
      ))}
    </motion.div>
  );
}
