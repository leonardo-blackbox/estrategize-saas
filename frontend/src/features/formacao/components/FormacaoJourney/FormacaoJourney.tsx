import { cn } from '../../../../lib/cn.ts';
import { ScrollReveal } from '../../../../components/motion/ScrollReveal.tsx';
import { MOCK_JOURNEY } from '../../formacao.constants';

export function FormacaoJourney() {
  return (
    <ScrollReveal delay={0.1} className="mt-12 sm:mt-16">
      <div className="px-4 sm:px-0 mb-6 flex flex-col gap-1">
        <h3 className="text-[22px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          Jornada do Consultor Digital
        </h3>
        <p className="text-[15px] text-[var(--color-text-secondary)]">
          Siga o caminho estruturado do iniciante ao mestre.
        </p>
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory px-5 sm:px-0 pb-6 sm:pb-0 scrollbar-none gap-4">
        {MOCK_JOURNEY.map((item) => (
          <div
            key={item.id}
            className="w-[85vw] sm:w-[320px] shrink-0 snap-center sm:snap-align-start h-full"
          >
            <div className={cn(
              "relative flex flex-col h-full min-h-[220px] rounded-[24px] p-6 border",
              item.recommended
                ? "bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
                : "bg-[var(--color-bg-secondary)] border-[var(--color-border-subtle)]"
            )}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  {item.step}
                </span>
                {item.recommended && (
                  <span className="inline-flex items-center rounded-sm bg-[var(--accent-subtle)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">
                    Recomendado
                  </span>
                )}
              </div>

              <h4 className="text-[18px] font-semibold text-[var(--color-text-primary)] tracking-tight mb-2">
                {item.title}
              </h4>
              <p className="text-[14px] text-[var(--color-text-secondary)] mb-6 flex-1">
                {item.description}
              </p>

              <button
                disabled={item.cta === 'Trancado'}
                className={cn(
                  "mt-auto inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[14px] font-semibold transition-all duration-200 outline-none focus-visible:ring-2 min-h-[44px]",
                  item.recommended
                    ? "bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] active:scale-95"
                    : item.cta === 'Trancado'
                      ? "bg-[var(--color-bg-active)] text-[var(--color-text-tertiary)] cursor-not-allowed opacity-60"
                      : "bg-[var(--color-bg-active)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] active:scale-95"
                )}
              >
                {item.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </ScrollReveal>
  );
}
