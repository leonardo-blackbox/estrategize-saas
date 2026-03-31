import { motion } from 'framer-motion';
import { staggerReveal, fadeInUp, slideInLeft } from '@/lib/motion';
import irisAbout from '@/assets/iris-about.png';

export function AboutSection() {
  return (
    <section className="landing-about">
      <div className="landing-about-grid">
        {/* Visual card */}
        <motion.div
          variants={slideInLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="landing-about-visual"
        >
          <div className="landing-about-card">
            <img
              src={irisAbout}
              alt="Iris Matos"
              className="landing-about-photo"
            />
            <motion.div
              className="landing-about-badge"
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <p className="landing-about-badge-title">+50 educadoras</p>
              <p className="landing-about-badge-sub">já transformaram seus negócios</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          className="landing-about-text"
          variants={staggerReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.p className="landing-section-label" variants={fadeInUp}>Sobre</motion.p>
          <motion.h2 className="landing-section-title" variants={fadeInUp}>Iris Matos</motion.h2>
          <motion.div className="landing-about-divider" variants={fadeInUp} />
          <motion.p className="landing-section-sub" variants={fadeInUp}>
            Consultora estratégica especializada em educadoras da beleza. Ajudo nail designers
            e profissionais da beleza a transformarem o que já sabem em negócios digitais lucrativos.
          </motion.p>
          <motion.p className="landing-section-sub" variants={fadeInUp}>
            Não trabalho com receitas genéricas. Cada estratégia é construída a partir da
            realidade, do nicho e dos objetivos específicos de cada cliente.
          </motion.p>
          <motion.p className="landing-section-sub" variants={fadeInUp}>
            Resultados como R$22.000 em um dia de carrinho aberto e turmas fechando em questão
            de semanas não são coincidência. São estratégia bem executada.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
