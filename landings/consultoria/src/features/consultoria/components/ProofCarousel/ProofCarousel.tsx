import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// AnimatePresence used for content transition only

import dep1 from '@/assets/provas/dep-1.jpg';
import dep2 from '@/assets/provas/dep-2.png';
import dep3 from '@/assets/provas/dep-3.png';
import dep4 from '@/assets/provas/dep-4.png';
import dep5 from '@/assets/provas/dep-5.jpg';

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

const BASE_SPRING = { type: 'spring', stiffness: 260, damping: 30, mass: 1 } as const;

const CONTENT_ANIM = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
};

const PROOFS = [
  {
    id: 'valeria',
    imageSrc: dep1,
    meta: 'Nail Designer & Educadora',
    highlight: 'Primeira aluna: R$2.000',
    quote: '"Só com o seu direcionamento do primeiro encontro, fechei a primeira aluna cobrando 2k."',
    name: 'Valeria',
  },
  {
    id: 'thais-bessa',
    imageSrc: dep2,
    meta: 'Nail Designer & Educadora',
    highlight: 'R$22.000 em 1 dia',
    quote: '"Minha primeira turma do online depois da consultoria foram 22k em 1 dia de carrinho aberto. Sem anúncio, só conteúdo certo."',
    name: 'Thaís Bessa',
  },
  {
    id: 'raquel',
    imageSrc: dep3,
    meta: 'Educadora',
    highlight: 'R$23.547 no mês',
    quote: '"Esse mês eu já fiz mais que o mês passado. Saldo: R$23.547,47 — e ainda tem dias pela frente."',
    name: 'Raquel',
  },
  {
    id: 'ana',
    imageSrc: dep4,
    meta: 'Nail Designer & Educadora',
    highlight: 'R$12.000 em 1 dia nos stories',
    quote: '"Participei de uma mentoria que me custou 20 mil e não aprendi o que você me ensinou. O guia vendeu 12 mil em um dia nos stories."',
    name: 'Ana Educadora',
  },
  {
    id: 'thays',
    imageSrc: dep5,
    meta: 'Nail Designer',
    highlight: 'Turma fechada em dias',
    quote: '"Nunca imaginei que podia chegar nesses números. A Iris me mostrou que não precisava dançar no Reels — precisava de estratégia."',
    name: 'Thays Burgarelli',
  },
];

export function ProofCarousel() {
  const [active, setActive] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const lastWheel = useRef(0);
  const count = PROOFS.length;
  const activeIndex = wrap(0, count, active);
  const activeItem = PROOFS[activeIndex];

  const handlePrev = useCallback(() => setActive(p => p - 1), []);
  const handleNext = useCallback(() => setActive(p => p + 1), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheel.current < 600) return;
    const isH = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    const delta = isH ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 30) {
      delta > 0 ? handleNext() : handlePrev();
      lastWheel.current = now;
    }
  }, [handleNext, handlePrev]);

  useEffect(() => {
    if (isHovering) return;
    const t = setInterval(handleNext, 5000);
    return () => clearInterval(t);
  }, [isHovering, handleNext]);

  const onDragEnd = (_: unknown, { offset, velocity }: { offset: { x: number }; velocity: { x: number } }) => {
    const power = Math.abs(offset.x) * velocity.x;
    if (power < -10000) handleNext();
    else if (power > 10000) handlePrev();
  };

  const visibleOffsets = [-2, -1, 0, 1, 2];

  return (
    <section
      className="landing-proof-focus"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onWheel={onWheel}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
      }}
    >
      {/* Header */}
      <div className="landing-proof-focus-header">
        <p className="landing-section-label">Resultados de quem já passou</p>
        <h2 className="landing-section-title">Palavras delas.</h2>
      </div>

      {/* 3D Rail */}
      <motion.div
        className="landing-proof-focus-rail"
        style={{ perspective: '2000px' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={onDragEnd}
      >
        {visibleOffsets.map(offset => {
          const absIndex = active + offset;
          const index = wrap(0, count, absIndex);
          const item = PROOFS[index];
          const isCenter = offset === 0;
          const dist = Math.abs(offset);

          return (
            <motion.div
              key={absIndex}
              className={`landing-proof-focus-card ${isCenter ? 'is-center' : ''}`}
              initial={false}
              animate={{
                x: offset * 380,
                z: isCenter ? 0 : -300 - dist * 80,
                scale: isCenter ? 1 : 0.82,
                rotateY: offset * -14,
                opacity: isCenter ? 1 : Math.max(0, 0.85 - dist * 0.3),
              }}
              transition={BASE_SPRING}
              style={{ transformStyle: 'preserve-3d' }}
              onClick={() => offset !== 0 && setActive(p => p + offset)}
            >
              <img src={item.imageSrc} alt={item.name} draggable={false} />
              {!isCenter && <div className="landing-proof-focus-card-overlay" />}
              <div className="landing-proof-focus-card-ring" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Content + Controls */}
      <div className="landing-proof-focus-bottom">
        {/* Text */}
        <div className="landing-proof-focus-content">
          <AnimatePresence mode="wait">
            <motion.div key={activeItem.id} {...CONTENT_ANIM} className="landing-proof-focus-text">
              <span className="landing-proof-focus-meta">{activeItem.meta}</span>
              <p className="landing-proof-focus-highlight">{activeItem.highlight}</p>
              <p className="landing-proof-focus-quote">{activeItem.quote}</p>
              <p className="landing-proof-focus-name">— {activeItem.name}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="landing-proof-focus-controls">
          <button
            onClick={handlePrev}
            className="landing-proof-focus-btn"
            aria-label="Anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <div className="landing-proof-focus-dots">
            {PROOFS.map((_, i) => (
              <button
                key={i}
                className={`landing-proof-focus-dot ${i === activeIndex ? 'active' : ''}`}
                onClick={() => setActive(i)}
                aria-label={`Ir para depoimento ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="landing-proof-focus-btn"
            aria-label="Próximo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
