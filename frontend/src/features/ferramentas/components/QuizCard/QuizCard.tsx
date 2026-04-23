import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staggerItem } from '../../../../lib/motion.ts';
import { listQuizzes, quizKeys } from '../../../quiz/services/quiz.api.ts';

export function QuizCard() {
  const { data: quizzes } = useQuery({
    queryKey: quizKeys.lists(),
    queryFn: listQuizzes,
    staleTime: 2 * 60 * 1000,
  });
  const totalQuizzes = quizzes?.length ?? 0;
  const totalResponses = quizzes?.reduce((sum, quiz) => sum + (quiz.response_count ?? 0), 0) ?? 0;

  return (
    <motion.div variants={staggerItem}>
      <Link to="/quiz" className="block group">
        <motion.div
          whileHover={{ translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-1)]"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
        >
          <div className="relative h-40 overflow-hidden bg-[linear-gradient(135deg,#082f49,#0f172a)]">
            <div className="absolute inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 25% 30%, rgba(103,232,249,.35), transparent 28%), radial-gradient(circle at 76% 68%, rgba(20,184,166,.32), transparent 30%)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-12 w-20 rounded-2xl border border-cyan-200/25 bg-white/10" />)}
              </div>
            </div>
            <span className="absolute right-3 top-3 rounded-full border border-cyan-200/40 bg-cyan-200/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cyan-100">NOVO</span>
          </div>
          <div className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[rgba(20,184,166,.24)] bg-[rgba(20,184,166,.12)] text-sm">?</div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quiz</h3>
              </div>
              <svg className="h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[var(--text-tertiary)]">Crie diagnósticos com score, resultados personalizados e eventos Meta.</p>
            <div className="mb-3 h-px bg-[var(--border-hairline)]" />
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
              <span><span className="font-semibold text-[var(--accent)]">{totalQuizzes}</span> quizzes</span>
              <span className="opacity-40">·</span>
              <span><span className="font-medium text-[var(--text-secondary)]">{totalResponses}</span> respostas</span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
