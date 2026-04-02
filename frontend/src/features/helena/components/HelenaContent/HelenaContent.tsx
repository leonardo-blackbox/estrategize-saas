import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';

const FEATURES = [
  { icon: '🎯', label: 'Detecção de objeções', desc: 'Reconhece frases de hesitação e sugere como responder' },
  { icon: '💡', label: 'Sinais de compra', desc: 'Identifica quando a cliente está pronta para fechar' },
  { icon: '🔑', label: 'Técnicas ao vivo', desc: 'Rapport, ancoragem, fechamento por consequência' },
] as const;

export function HelenaContent() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-2xl mx-auto space-y-8 py-4"
    >
      <motion.div variants={staggerItem} className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-xl shrink-0"
          style={{ background: 'rgba(124,92,252,0.12)', border: '1.5px solid rgba(124,92,252,0.25)' }}
        >
          🤖
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Helena</h1>
          <p className="text-sm text-[var(--text-secondary)]">Copiloto de reuniões com IA</p>
        </div>
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="rounded-[var(--radius-md)] p-6 space-y-4 border border-[var(--border-hairline)] bg-[var(--bg-surface-1)]"
      >
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          A Helena acompanha suas reuniões de vendas em tempo real e sugere abordagens comerciais baseadas no que a cliente está dizendo — objeções, sinais de compra, momento de fechar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {FEATURES.map((item) => (
            <div
              key={item.label}
              className="rounded-[var(--radius-sm)] p-3 space-y-1.5"
              style={{ background: 'rgba(124,92,252,0.06)', border: '1px solid rgba(124,92,252,0.12)' }}
            >
              <div className="text-lg">{item.icon}</div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="rounded-[var(--radius-md)] p-5 flex items-center gap-4 border border-[var(--border-hairline)] bg-[var(--bg-surface-1)]"
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: '#a78bfa', boxShadow: '0 0 6px rgba(167,139,250,0.6)' }}
        />
        <p className="text-sm text-[var(--text-secondary)]">
          A Helena é ativada automaticamente durante suas reuniões quando o bot está ativo.
          Configure e teste em{' '}
          <Link to="/admin/plugins/helena" className="font-medium" style={{ color: '#a78bfa' }}>
            Admin → Plugins → Helena
          </Link>
          .
        </p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Link
          to="/ferramentas"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Voltar para Ferramentas
        </Link>
      </motion.div>
    </motion.div>
  );
}
