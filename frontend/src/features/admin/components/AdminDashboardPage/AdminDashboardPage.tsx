import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { adminGetStats } from '../../../../api/courses.ts';

function StatCard({ label, value, sub, href }: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] h-full hover:border-[var(--border-default)] transition-colors">
      <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
      {sub && <div className="text-[10px] text-[var(--text-tertiary)] mt-1">{sub}</div>}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}

function StatSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] animate-pulse">
      <div className="h-3 w-24 rounded bg-[var(--bg-hover)] mb-2" />
      <div className="h-7 w-16 rounded bg-[var(--bg-hover)]" />
    </div>
  );
}

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminGetStats,
    refetchInterval: 60_000,
  });

  const s = stats as any;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Admin Dashboard</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Visão geral da plataforma.</p>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={staggerItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Usuários" value={s?.totalUsers?.toLocaleString('pt-BR') ?? '—'} href="/admin/usuarios" />
            <StatCard label="Cursos publicados" value={s?.totalCourses?.toLocaleString('pt-BR') ?? '—'} href="/admin/cursos" />
            <StatCard label="Matrículas" value={s?.totalEnrollments?.toLocaleString('pt-BR') ?? '—'} href="/admin/turmas" />
            <StatCard label="Webhook events" value={s?.totalWebhookEvents?.toLocaleString('pt-BR') ?? '—'} href="/admin/stripe" />
            <StatCard label="Webhooks com falha" value={s?.failedWebhooks?.toLocaleString('pt-BR') ?? '—'} sub={s?.failedWebhooks > 0 ? 'Atenção: reprocessar eventos' : 'Tudo certo'} href="/admin/stripe" />
            <StatCard label="Ações de auditoria" value={s?.totalAuditActions?.toLocaleString('pt-BR') ?? '—'} href="/admin/stripe" />
          </>
        )}
      </motion.div>

      {/* Quick links */}
      <motion.div variants={staggerItem} className="grid sm:grid-cols-2 gap-3">
        <Link to="/admin/cursos" className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] hover:border-[var(--border-default)] transition-colors group">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">Gerenciar Cursos</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Criar, editar e publicar conteúdo</p>
          </div>
        </Link>
        <Link to="/admin/usuarios" className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] hover:border-[var(--border-default)] transition-colors group">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">Gerenciar Usuários</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Entitlements, acessos e matrículas</p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
