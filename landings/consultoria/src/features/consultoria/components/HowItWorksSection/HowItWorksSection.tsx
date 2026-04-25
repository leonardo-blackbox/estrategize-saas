import { motion } from 'framer-motion';
import { staggerReveal, fadeInUp } from '@/lib/motion';

const STEPS = [
  {
    number: '01',
    title: 'MERGULHO NA TÉCNICA',
    description: 'Eu mergulho na sua técnica e experiência para encontrar o que só você tem. O método que você desenvolveu ao longo dos anos e a transformação que suas alunas querem viver. Esse é o ouro que ninguém mais tem.',
  },
  {
    number: '02',
    title: 'SISTEMA DE CONTEÚDO',
    description: 'Traduzo isso em um sistema que você executa sozinha todo dia, sem travar. Cada dia da semana tem seu tipo de conteúdo. Cada tipo tem uma pasta com mais de 50 assuntos prontos para você usar.',
  },
  {
    number: '03',
    title: 'EXECUÇÃO E RESULTADO',
    description: 'Em até 10 dias úteis você já consegue produzir conteúdo no dia seguinte. Em 30 dias executando, alunas qualificadas chegam no seu WhatsApp querendo especificamente o que você ensina, sem questionar o preço.',
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
          O mecanismo único.<br />Não é receita genérica.
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
