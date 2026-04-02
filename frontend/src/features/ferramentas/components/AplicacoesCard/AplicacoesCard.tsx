import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staggerItem } from '../../../../lib/motion.ts';
import { fetchApplications, applicationKeys } from '../../../../api/applications.ts';

export function AplicacoesCard() {
  const { data: apps } = useQuery({
    queryKey: applicationKeys.lists(),
    queryFn: fetchApplications,
    staleTime: 2 * 60 * 1000,
  });

  const totalForms = apps?.length ?? 0;
  const totalResponses = apps?.reduce((sum, a) => sum + (a.response_count ?? 0), 0) ?? 0;

  return (
    <motion.div variants={staggerItem}>
      <Link to="/aplicacoes" className="block group">
        <motion.div
          whileHover={{ translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-1)]"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
        >
          {/* Animated preview area */}
          <div
            className="relative overflow-hidden"
            style={{
              height: 160,
              background: 'linear-gradient(135deg, #0d0a1a 0%, #0a0d1a 100%)',
            }}
          >
            <div
              className="absolute top-0 left-0 h-[3px] w-3/5"
              style={{
                background: 'linear-gradient(90deg, #7c5cfc, #5e5ce6)',
                boxShadow: '0 0 8px rgba(124,92,252,0.5)',
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none px-8">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-4/5 rounded-[6px]"
                style={{ height: 22, background: 'rgba(245,245,247,0.12)' }}
              />
              <div className="flex flex-col gap-1.5 w-full items-center">
                {[70, 85, 55].map((w, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    className="rounded-full"
                    style={{ height: 10, width: `${w}%`, background: 'rgba(124,92,252,0.35)' }}
                  />
                ))}
              </div>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: 48, background: 'linear-gradient(transparent, #0d0a1a)' }}
            />
            <div
              className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
              style={{ background: 'rgba(124,92,252,0.15)', color: '#7c5cfc', border: '1px solid rgba(124,92,252,0.3)' }}
            >
              NOVO
            </div>
          </div>

          {/* Card body */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 text-sm"
                  style={{ background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)' }}
                >
                  <svg className="w-4 h-4" style={{ color: '#7c5cfc' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Aplicações</h3>
              </div>
              <svg
                className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
              Crie formulários conversacionais para qualificar clientes e mentorias.
            </p>

            <div className="h-px mb-3" style={{ background: 'var(--border-hairline)' }} />

            <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
              <span>
                <span style={{ color: '#7c5cfc' }} className="font-semibold">{totalForms}</span> formulários
              </span>
              <span className="opacity-40">·</span>
              <span>
                <span className="font-medium text-[var(--text-secondary)]">{totalResponses}</span> respostas
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
