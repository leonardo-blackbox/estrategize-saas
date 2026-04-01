import { motion } from 'framer-motion';

interface ConsultoriasHeaderProps {
  isLoading: boolean;
  activeCount: number;
  onCreateClick: () => void;
}

export function ConsultoriasHeader({ isLoading, activeCount, onCreateClick }: ConsultoriasHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1
            className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Consultorias
          </h1>
          {!isLoading && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{
                background: 'rgba(0,200,150,0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(0,200,150,0.25)',
              }}
            >
              {activeCount} ativas
            </motion.span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] text-[var(--text-tertiary)]">
          Acompanhe o progresso e gerencie suas consultorias.
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCreateClick}
        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-[13px] font-semibold text-white transition-all"
        style={{
          background: 'linear-gradient(135deg, #00c896 0%, #00a87a 100%)',
          boxShadow: '0 4px 16px -2px rgba(0,200,150,0.35), 0 1px 0 rgba(255,255,255,0.15) inset',
        }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Nova Consultoria
      </motion.button>
    </div>
  );
}
