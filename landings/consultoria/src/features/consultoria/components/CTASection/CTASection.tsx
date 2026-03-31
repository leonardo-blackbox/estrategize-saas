import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { useCtaUrl } from '@/hooks/useCtaUrl';
import { trackInitiateForm } from '@/lib/pixel';

export function CTASection() {
  const ctaUrl = useCtaUrl();
  return (
    <section className="landing-cta">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        <motion.p className="landing-section-label" variants={staggerItem}>
          Vagas limitadas
        </motion.p>

        <motion.h2 variants={staggerItem}>
          Pronta para parar<br />de <em>adiar?</em>
        </motion.h2>

        <motion.p variants={staggerItem}>
          As vagas são limitadas e o formulário de aplicação leva menos de 3 minutos.
        </motion.p>

        <motion.div
          variants={staggerItem}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}
        >
          <a href={ctaUrl} className="btn-glow primary" style={{ fontSize: '16px', padding: '16px 36px' }} onClick={trackInitiateForm}>
            Quero aplicar agora →
          </a>
          <span style={{ fontSize: '13px', color: 'rgba(240,245,244,0.35)' }}>
            Após o envio, analisamos sua aplicação e entramos em contato em até 48h.
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
