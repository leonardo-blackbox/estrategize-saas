import { motion } from 'framer-motion';
import { staggerReveal, fadeInUp, checklistItem } from '@/lib/motion';

const FOR_ITEMS = [
  'Já tem curso e já vendeu pelo menos 2 vezes',
  'Fatura acima de R$8k por mês no atendimento e sua agenda está estável',
  'Sabe que precisa de posicionamento e conteúdo estratégico mas trava no como fazer na prática',
  'É executora, não procrastina e entende que resultado vem de consistência',
];

const NOT_FOR_ITEMS = [
  'Ainda não vendeu curso',
  'Fatura menos de R$5k por mês',
  'Ainda não tem uma agenda estável',
  'Quer que alguém execute por você diariamente',
];

export function QualificationSection() {
  return (
    <section className="landing-section landing-qualification">
      <motion.div
        className="landing-qual-header"
        variants={staggerReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.p className="landing-section-label" variants={fadeInUp}>
          Qualificação
        </motion.p>
        <motion.h2 className="landing-section-title" variants={fadeInUp}>
          Isso é para você?
        </motion.h2>
      </motion.div>

      <div className="landing-qual-grid">
        <motion.div
          className="landing-qual-card"
          variants={staggerReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <h3 className="landing-qual-card-title landing-qual-for-title">Para quem é</h3>
          <ul className="landing-qual-list">
            {FOR_ITEMS.map((item, i) => (
              <motion.li key={i} variants={checklistItem} className="landing-qual-item landing-qual-check">
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="landing-qual-card"
          variants={staggerReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="landing-qual-card-title landing-qual-not-title">Para quem NÃO é</h3>
          <ul className="landing-qual-list">
            {NOT_FOR_ITEMS.map((item, i) => (
              <motion.li key={i} variants={checklistItem} className="landing-qual-item landing-qual-x">
                {item}
              </motion.li>
            ))}
          </ul>
          <p className="landing-qual-note">
            A consultoria é construída do zero para cada cliente. Por isso atendo no máximo 8 por mês.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
