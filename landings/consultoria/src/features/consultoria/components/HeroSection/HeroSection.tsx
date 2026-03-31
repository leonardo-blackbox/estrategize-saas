import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { useCtaUrl } from '@/hooks/useCtaUrl';
import { trackInitiateForm } from '@/lib/pixel';
import irisHero from '@/assets/iris-hero-web.jpg';
import logoEstrategize from '@/assets/logo-estrategize-white.png';

export function HeroSection() {
  const [scrolled, setScrolled] = useState(false);
  const ctaUrl = useCtaUrl();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="landing-hero">
      {/* Navbar sobreposto */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <img
          src={logoEstrategize}
          alt="Estrategize"
          className="landing-nav-logo-img"
        />
        <a href={ctaUrl} className="landing-nav-cta" onClick={trackInitiateForm}>
          Quero aplicar
        </a>
      </nav>

      {/* Foto */}
      <img src={irisHero} alt="Iris Matos" className="landing-hero-img" />

      {/* Gradientes */}
      <div className="landing-hero-gradient" />

      {/* Conteúdo */}
      <motion.div
        className="landing-hero-content"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.p className="landing-hero-label" variants={staggerItem}>
          Consultoria Estratégica
        </motion.p>

        <motion.h1 variants={staggerItem}>
          Você tem a técnica.<br />O que falta<br />é <em>estratégia.</em>
        </motion.h1>

        <motion.p className="landing-hero-sub" variants={staggerItem}>
          Mais de 50 educadoras da beleza já descobriram que o problema nunca foi o curso.
          Foi a falta de direção para o que já sabem.
        </motion.p>

        <motion.div className="landing-hero-actions" variants={staggerItem}>
          <a href={ctaUrl} className="btn-glow primary" onClick={trackInitiateForm}>
            Quero aplicar para a consultoria →
          </a>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            Vagas limitadas · Resposta em até 48h
          </span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="landing-scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="0.5" y="0.5" width="15" height="23" rx="7.5" stroke="currentColor" strokeOpacity="0.5"/>
            <rect x="7" y="4" width="2" height="6" rx="1" fill="currentColor"/>
          </svg>
        </motion.div>
        <span>scroll</span>
      </motion.div>
    </section>
  );
}
