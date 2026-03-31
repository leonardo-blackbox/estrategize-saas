import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useCountUp } from '../../hooks/useCountUp';
import { staggerReveal, fadeInUp } from '@/lib/motion';

interface NumberItem {
  prefix?: string;
  value: number;
  suffix?: string;
  separator?: string;
  label: string;
}

const NUMBERS: NumberItem[] = [
  { prefix: 'R$', value: 23547, separator: '.', label: 'Faturamento em 1 mês\n(Raquel — resultado real)' },
  { prefix: 'R$', value: 22000, separator: '.', label: 'Em 1 dia de carrinho aberto\n(Thaís Bessa — sem anúncio)' },
  { value: 7, suffix: ' turmas', label: 'Em 1 ano a partir do zero\n(Thaís — método aplicado)' },
];

function formatNumber(n: number, separator?: string): string {
  if (!separator) return String(n);
  return n.toLocaleString('pt-BR').replace(/,/g, separator);
}

function CountUpItem({ item, inView }: { item: NumberItem; inView: boolean }) {
  const count = useCountUp(item.value, 1600, inView);
  return (
    <p className="landing-number-value">
      {item.prefix ?? ''}{formatNumber(count, item.separator)}{item.suffix ?? ''}
    </p>
  );
}

export function NumbersSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className="landing-numbers"
      variants={staggerReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {NUMBERS.map((n, i) => (
        <motion.div key={i} className="landing-number-item" variants={fadeInUp}>
          <CountUpItem item={n} inView={inView} />
          <p className="landing-number-label" style={{ whiteSpace: 'pre-line' }}>{n.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
