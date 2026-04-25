import { motion } from 'framer-motion';
import { staggerReveal, fadeInUp } from '@/lib/motion';

const PAINS = [
  'Você posta. Recebe "quanto é?" e a aluna some. Isso não é azar. É comunicação errada.',
  'Cada mês sem resolver o posicionamento é mais um mês afastando a aluna certa e queimando a audiência com conteúdo que todo mundo já posta.',
  'Você sabe que precisa de conteúdo estratégico. O problema é que trava no como fazer na prática, sozinha, todo dia.',
];

export function ProblemSection() {
  return (
    <section className="landing-problem">
      <motion.div
        className="landing-problem-header"
        variants={staggerReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.p className="landing-section-label" variants={fadeInUp}>
          O problema
        </motion.p>
        <motion.h2 className="landing-section-title" variants={fadeInUp}>
          Você não está vendendo menos<br />por falta de técnica.
        </motion.h2>
        <motion.p className="landing-section-sub" variants={fadeInUp}>
          Quem te segue ainda não consegue enxergar o quanto você é boa.
        </motion.p>
      </motion.div>

      <motion.div
        className="landing-pains"
        variants={staggerReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {PAINS.map((pain, i) => (
          <motion.div key={i} className="landing-pain-item" variants={fadeInUp}>
            <span className="landing-pain-dot" aria-hidden="true" />
            <p className="landing-pain-text">{pain}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="landing-problem-cta"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        <a href="https://app.estrategize.co/f/tR9qWs4j" className="btn-glow primary">
          Quero aplicar para a consultoria →
        </a>
      </motion.div>
    </section>
  );
}
