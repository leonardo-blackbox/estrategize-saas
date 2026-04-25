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
            A maioria dos consultores te ensina estratégia genérica. Estratégia genérica não
            comunica o que é único em você. Comunica o que todo mundo já está postando.
          </motion.p>
          <motion.p className="landing-section-sub" variants={fadeInUp}>
            Na consultoria eu faço o oposto. Primeiro mergulho na sua técnica e experiência
            para encontrar o que só você tem. Depois traduzo isso em um sistema de conteúdo
            que você consegue executar sozinha, sem travar, sem passar horas pensando no que falar.
          </motion.p>
          <motion.p className="landing-section-sub" variants={fadeInUp}>
            É por isso que as clientes param de ouvir "está caro" e começam a fechar alunas
            que já chegam querendo especificamente o que elas ensinam.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
