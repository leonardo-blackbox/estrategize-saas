import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { AplicacoesCard } from '../AplicacoesCard';
import { QuizCard } from '../QuizCard';
import { ReunioesCard } from '../ReunioesCard';
import { HelenaCard } from '../HelenaCard';

const TOOL_COUNT = 4;

export function FerramentasContent() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-6xl mx-auto space-y-8"
    >
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-3">
          <h1
            className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Ferramentas
          </h1>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{
              background: 'rgba(0,200,150,0.12)',
              color: 'var(--accent)',
              border: '1px solid rgba(0,200,150,0.25)',
            }}
          >
            {TOOL_COUNT} disponíveis
          </motion.span>
        </div>
        <p className="mt-1.5 text-[13px] text-[var(--text-tertiary)]">
          Ferramentas estratégicas para acelerar suas decisões de negócio.
        </p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1 mb-3">
          Captação
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AplicacoesCard />
          <QuizCard />
          <ReunioesCard />
          <HelenaCard />
        </div>
      </motion.div>
    </motion.div>
  );
}
