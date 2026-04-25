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
          Máximo 8 vagas por mês
        </motion.p>

        <motion.h2 variants={staggerItem}>
          Cada mês que passa<br />tem um <em>preço.</em>
        </motion.h2>

        <motion.p variants={staggerItem}>
          Você continua afastando a aluna certa e queimando a audiência com conteúdo errado.
          O mais difícil você já resolveu: tem um curso que gera transformação.
          O que falta é só uma coisa.
        </motion.p>

        <motion.p variants={staggerItem} style={{ fontSize: '14px', color: 'rgba(240,245,244,0.55)', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
          Reserve sua vaga com um sinal de R$500 no PIX. Esse valor é descontado do total
          e você paga os R$2.500 restantes até o dia da primeira reunião.
          Assim que a reserva é confirmada, a gente já marca o primeiro encontro.
        </motion.p>

        <motion.div
          variants={staggerItem}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}
        >
          <a href={ctaUrl} className="btn-glow primary" style={{ fontSize: '16px', padding: '16px 36px' }} onClick={trackInitiateForm}>
            Quero reservar minha vaga →
          </a>
          <span style={{ fontSize: '13px', color: 'rgba(240,245,244,0.35)' }}>
            Quem não reserva agora entra para a lista de espera.
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
