import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerItem } from '../../../../lib/motion.ts';

export function HelenaCard() {
  return (
    <motion.div variants={staggerItem}>
      <Link to="/ferramentas/helena" className="block group">
        <motion.div
          whileHover={{ translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-1)]"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
        >
          {/* Preview area */}
          <div
            className="relative overflow-hidden"
            style={{ height: 160, background: 'linear-gradient(135deg, #0e0a1f 0%, #130d2a 100%)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.6 + i * 0.3, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
                  className="absolute rounded-full border"
                  style={{
                    width: 40 + i * 28,
                    height: 40 + i * 28,
                    borderColor: `rgba(124,92,252,${0.35 - i * 0.08})`,
                  }}
                />
              ))}
              <div
                className="relative w-11 h-11 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'rgba(124,92,252,0.15)', border: '1.5px solid rgba(124,92,252,0.4)' }}
              >
                🤖
              </div>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: 48, background: 'linear-gradient(transparent, #0e0a1f)' }}
            />
            <div
              className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
              style={{ background: 'rgba(124,92,252,0.15)', color: '#a78bfa', border: '1px solid rgba(124,92,252,0.3)' }}
            >
              IA
            </div>
          </div>

          {/* Card body */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 text-sm"
                  style={{ background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.25)' }}
                >
                  🤖
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Helena</h3>
              </div>
              <svg
                className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
              Copiloto de IA que sugere abordagens comerciais em tempo real durante a reunião.
            </p>
            <div className="h-px mb-3" style={{ background: 'var(--border-hairline)' }} />
            <div className="flex items-center gap-2 text-[11px]" style={{ color: '#a78bfa' }}>
              <span>Copiloto ao vivo</span>
              <span className="opacity-40">·</span>
              <span style={{ color: 'var(--text-tertiary)' }}>Fechamento</span>
              <span className="opacity-40">·</span>
              <span style={{ color: 'var(--text-tertiary)' }}>Objeções</span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
