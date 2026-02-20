import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { isDaysUrgent } from '../../lib/dates.ts';
import { Badge } from '../../components/ui/Badge.tsx';

// Mock data
const continueLearning = {
  id: 'curso-1',
  title: 'Estrategia Empresarial Avancada',
  module: 'Modulo 3: Analise Competitiva',
  lesson: 'Aula 7: Cinco Forcas de Porter',
  progress: 68,
  thumbnail: null,
};

const courses = [
  { id: 'curso-1', title: 'Estrategia Empresarial Avancada', lessons: 24, progress: 68, status: 'active' as const },
  { id: 'curso-2', title: 'Lideranca e Gestao de Equipes', lessons: 18, progress: 0, status: 'locked' as const, requiredOffer: 'Plano Pro' },
  { id: 'curso-3', title: 'Growth & Escala', lessons: 12, progress: 0, status: 'drip' as const, dripDate: '2026-03-15' },
  { id: 'curso-4', title: 'Financas para Decisores', lessons: 16, progress: 35, status: 'expiring' as const, expiryDate: '2026-02-27' },
];

function EntitlementBadge({ status, requiredOffer, dripDate, expiryDate }: {
  status: 'active' | 'locked' | 'drip' | 'expiring';
  requiredOffer?: string;
  dripDate?: string;
  expiryDate?: string;
}) {
  const isUrgent = status === 'expiring' && isDaysUrgent(expiryDate);

  if (status === 'locked') {
    return (
      <Badge variant="locked">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        Requer {requiredOffer}
      </Badge>
    );
  }
  if (status === 'drip') {
    return <Badge variant="drip">Libera em {dripDate}</Badge>;
  }
  if (status === 'expiring') {
    return <Badge variant={isUrgent ? 'expiring' : 'default'}>Expira em {expiryDate}</Badge>;
  }
  return null;
}

export function FormacaoPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Continue Learning Hero */}
      <motion.div variants={staggerItem}>
        <Link
          to={`/formacao/curso/${continueLearning.id}`}
          className={cn(
            'block rounded-[var(--radius-lg)] p-5 sm:p-6',
            'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
            'hover:border-[var(--border-default)] transition-all duration-200',
            'shadow-[var(--shadow-soft)]',
            'group',
          )}
        >
          <div className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Continuar aprendendo
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            {continueLearning.title}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {continueLearning.module} &middot; {continueLearning.lesson}
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--text-primary)] rounded-full transition-all duration-500"
                style={{ width: `${continueLearning.progress}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-tertiary)] font-medium">
              {continueLearning.progress}%
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-primary)] font-medium group-hover:gap-3 transition-all">
            Continuar
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </Link>
      </motion.div>

      {/* Courses Grid */}
      <motion.div variants={staggerItem}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Seus Cursos
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((course) => (
            <motion.div key={course.id} variants={staggerItem}>
              <Link
                to={course.status === 'locked' ? '#' : `/formacao/curso/${course.id}`}
                className={cn(
                  'block rounded-[var(--radius-md)] p-4',
                  'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                  'transition-all duration-200',
                  course.status === 'locked'
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-[var(--border-default)] hover:-translate-y-0.5',
                )}
                onClick={course.status === 'locked' ? (e) => e.preventDefault() : undefined}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                    {course.title}
                  </h4>
                  <EntitlementBadge
                    status={course.status}
                    requiredOffer={course.requiredOffer}
                    dripDate={course.dripDate}
                    expiryDate={course.expiryDate}
                  />
                </div>

                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  {course.lessons} aulas
                </p>

                {course.progress > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--text-primary)] rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {course.progress}%
                    </span>
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
