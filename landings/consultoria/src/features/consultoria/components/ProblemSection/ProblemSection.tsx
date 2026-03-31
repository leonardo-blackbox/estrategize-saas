import { motion } from 'framer-motion';
import { staggerReveal, fadeInUp } from '@/lib/motion';

const PAINS = [
  'Mais um mês. Mais um ano. Com o mesmo sonho parado no mesmo lugar.',
  'Não é falta de curso. Não é falta de talento. É falta de alguém que olhe para o SEU caso.',
  'Enquanto você espera o momento certo, outras professoras estão fechando turma.',
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
          Adiar também<br />é uma decisão.
        </motion.h2>
        <motion.p className="landing-section-sub" variants={fadeInUp}>
          E ela tem um preço que a maioria ignora.
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
