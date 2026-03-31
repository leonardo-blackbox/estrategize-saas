import { HeroSection } from '../HeroSection';
import { useCtaUrl } from '@/hooks/useCtaUrl';
import { trackInitiateForm } from '@/lib/pixel';
import { NumbersSection } from '../NumbersSection';
import { ProblemSection } from '../ProblemSection';
import { ProofCarousel } from '../ProofCarousel';
import { HowItWorksSection } from '../HowItWorksSection';
import { QualificationSection } from '../QualificationSection';
import { AboutSection } from '../AboutSection';
import { CTASection } from '../CTASection';
import '@/landing.css';

export function LandingPageAggregator() {
  const ctaUrl = useCtaUrl();
  return (
    <div className="landing">
      {/* 1. Hero full-viewport */}
      <HeroSection />

      {/* 2. Números de resultado animados */}
      <NumbersSection />

      {/* 3. Problema */}
      <ProblemSection />

      {/* 4. Depoimentos */}
      <ProofCarousel />

      {/* 5. Como funciona */}
      <HowItWorksSection />

      {/* 6. Qualificação */}
      <QualificationSection />

      {/* 7. Sobre Iris */}
      <AboutSection />

      {/* 8. CTA final */}
      <CTASection />

      {/* 9. Footer */}
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Estrategize · Iris Matos</span>
        <a href={ctaUrl} style={{ color: 'inherit', textDecoration: 'none' }} onClick={trackInitiateForm}>
          Quero aplicar
        </a>
      </footer>
    </div>
  );
}
