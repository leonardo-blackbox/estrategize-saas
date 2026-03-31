import { motion } from 'framer-motion';
import { staggerReveal, fadeInUp, checklistItem } from '@/lib/motion';

const FOR_ITEMS = [
  'Você já atua como nail designer ou profissional da beleza',
  'Já tem técnica e experiência — não é iniciante do zero',
  'Quer criar ou já tem um curso/mentoria, mas não sabe como vender',
  'Está cansada de trabalhar muito e ganhar pouco',
  'Quer parar de depender apenas do atendimento físico',
];

const NOT_FOR_ITEMS = [
  'Você ainda está começando do zero, sem experiência',
  'Quer uma mentoria genérica de marketing',
  'Não está disposta a implementar o que for recomendado',
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
            A consultoria é personalizada e as vagas são limitadas para garantir atenção dedicada a cada cliente.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
