import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { AplicacoesCard } from '../AplicacoesCard';
import { QuizCard } from '../QuizCard';
import { ReunioesCard } from '../ReunioesCard';
import { HelenaCard } from '../HelenaCard';

export function FerramentasContent() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-8"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Ferramentas</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
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
