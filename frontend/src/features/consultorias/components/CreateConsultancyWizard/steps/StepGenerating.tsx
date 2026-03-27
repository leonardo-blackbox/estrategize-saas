import { motion } from 'framer-motion';

interface StepGeneratingProps {
  clientName: string;
  progress: number;
}

export function StepGenerating({ clientName, progress }: StepGeneratingProps) {
  return (
    <motion.div key="step3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex flex-col items-center gap-6 py-8">
      <div className="relative h-20 w-20">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} className="absolute inset-0 rounded-full opacity-60" style={{ background: 'conic-gradient(from 0deg, var(--consulting-iris), var(--consulting-ai-accent), var(--consulting-iris))' }} />
        <div className="absolute inset-2 rounded-full bg-[var(--bg-base)]" />
        <div className="absolute inset-3 rounded-full" style={{ background: 'var(--consulting-iris-subtle)' }} />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-[15px] font-semibold text-[var(--text-primary)]">Preparando IA Dedicada</p>
        <p className="text-[13px] text-[var(--text-tertiary)] max-w-xs leading-relaxed">A Iris está analisando o contexto e preparando a IA Dedicada para {clientName || 'o cliente'}…</p>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'var(--consulting-progress-track)' }}>
          <motion.div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--consulting-ai-gradient)', transition: 'width 0.1s linear' }} />
        </div>
      </div>
    </motion.div>
  );
}
