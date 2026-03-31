import { motion } from 'framer-motion';
import { staggerReveal, fadeInUp } from '@/lib/motion';

const STEPS = [
  {
    number: '01',
    title: 'DIAGNÓSTICO',
    description: 'Olho para o SEU caso, entendo o SEU nicho, mapeio os gargalos reais do seu negócio.',
  },
  {
    number: '02',
    title: 'ESTRATÉGIA',
    description: 'Crio as estratégias específicas para você. Não receita pronta — o que funciona para a sua realidade.',
  },
  {
    number: '03',
    title: 'RESULTADO',
    description: 'Em poucos dias você já está executando e vendo o resultado acontecer.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="landing-howitworks">
      <motion.div
        variants={staggerReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.p className="landing-section-label" variants={fadeInUp}>
          Como funciona
        </motion.p>
        <motion.h2 className="landing-section-title" variants={fadeInUp}>
          Três passos.<br />Resultado real.
        </motion.h2>
      </motion.div>

      <div className="landing-steps">
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            className="landing-step"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.2 }}
          >
            <div className="landing-step-number" aria-hidden="true">
              {step.number}
            </div>
            <div className="landing-step-content">
              <p className="landing-step-title">{step.title}</p>
              <p className="landing-step-desc">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
