import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staggerItem } from '../../../../lib/motion.ts';
import { listAllMeetings, meetingKeys } from '../../../../api/meetings.ts';

export function ReunioesCard() {
  const { data } = useQuery({
    queryKey: meetingKeys.all,
    queryFn: listAllMeetings,
    staleTime: 2 * 60 * 1000,
  });

  const sessions = data?.sessions ?? [];
  const totalMeetings = sessions.length;
  const totalTranscricoes = sessions.filter((s) => s.status === 'done' && s.summary).length;

  return (
    <motion.div variants={staggerItem}>
      <Link to="/reunioes" className="block group">
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
              background: 'linear-gradient(135deg, #0a1218 0%, #0d1520 100%)',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-10">
              {[40, 70, 55, 90, 60, 80, 45, 75, 50, 85, 65, 40].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [1, 1.5 + Math.random(), 0.8, 1.2, 1] }}
                  transition={{
                    duration: 1.5 + i * 0.1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.08,
                  }}
                  className="rounded-full"
                  style={{
                    width: 3,
                    height: h * 0.6,
                    background: i % 3 === 0
                      ? 'rgba(96,165,250,0.7)'
                      : i % 3 === 1
                        ? 'rgba(124,92,252,0.6)'
                        : 'rgba(96,165,250,0.35)',
                    transformOrigin: 'center',
                  }}
                />
              ))}
            </div>
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: 48, background: 'linear-gradient(transparent, #0a1218)' }}
            />
            <div
              className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
            >
              GRÁTIS
            </div>
          </div>

          {/* Card body */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 text-sm"
                  style={{ background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.2)' }}
                >
                  🎙️
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Transcrição de Reunião</h3>
              </div>
              <svg
                className="w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
              Bot IA que transcreve suas reuniões e extrai resumos e planos de ação automaticamente.
            </p>

            <div className="h-px mb-3" style={{ background: 'var(--border-hairline)' }} />

            <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
              <span>
                <span style={{ color: '#60a5fa' }} className="font-semibold">{totalMeetings}</span> reuniões
              </span>
              <span className="opacity-40">·</span>
              <span>
                <span className="font-medium text-[var(--text-secondary)]">{totalTranscricoes}</span> transcrições
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
