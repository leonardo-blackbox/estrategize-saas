import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore.ts';
import { Section } from '../components/dashboard/Section.tsx';
import { HorizontalScroller } from '../components/dashboard/HorizontalScroller.tsx';
import { Card } from '../components/dashboard/Card.tsx';
import { EmptyState } from '../components/dashboard/EmptyState.tsx';
import {
  mockActiveConsultancies,
  mockNextActions,
  mockRecommendedTools,
  mockRecentActivities,
  mockRecommendedCourses,
  mockLockedResources,
} from '../mocks/dashboardMock.ts';
import { CreditBalanceCard } from '../components/credits/CreditBalanceCard.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { staggerContainer, staggerItem } from '../lib/motion.ts';

const statusLabel: Record<string, string> = {
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  completed: 'Completed',
};

const statusBadgeVariant: Record<string, 'default' | 'success' | 'expiring'> = {
  in_progress: 'drip' as 'default',
  pending_review: 'expiring',
  completed: 'success',
};

const priorityStyle: Record<string, string> = {
  high: 'text-[var(--color-error)]',
  medium: 'text-[var(--color-warning)]',
  low: 'text-[var(--text-muted)]',
};

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      {/* 1. Banner estrategico */}
      <motion.div
        variants={staggerItem}
        className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 sm:p-8 shadow-[var(--shadow-soft)]"
      >
        <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
          Welcome back, {user?.user_metadata?.full_name ?? user?.email}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-[var(--text-secondary)] leading-relaxed">
          Your strategic consulting hub. Track consultancies, run AI diagnostics,
          and accelerate your clients&apos; growth.
        </p>
      </motion.div>

      {/* 2-column grid on lg */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-8">
          {/* 2. Consultorias Ativas */}
          <motion.div variants={staggerItem}>
            <Section title="Active Consultancies">
              {mockActiveConsultancies.length === 0 ? (
                <EmptyState message="No active consultancies yet." />
              ) : (
                <HorizontalScroller>
                  {mockActiveConsultancies.map((c) => (
                    <Card
                      key={c.id}
                      className="min-w-[260px] max-w-[300px] flex-shrink-0 snap-start"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <Badge variant={statusBadgeVariant[c.status] ?? 'default'}>
                          {statusLabel[c.status]}
                        </Badge>
                        <span className="text-xs text-[var(--text-muted)]">{c.updatedAt}</span>
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{c.title}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.client}</p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                          <span>Progress</span>
                          <span>{c.progress}%</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-[var(--bg-surface-2)]">
                          <div
                            className="h-1.5 rounded-full bg-[var(--text-primary)] transition-all duration-500"
                            style={{ width: `${c.progress}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </HorizontalScroller>
              )}
            </Section>
          </motion.div>

          {/* 3. Proximas Acoes */}
          <motion.div variants={staggerItem}>
            <Section title="Next Actions">
              {mockNextActions.length === 0 ? (
                <EmptyState message="No pending actions." />
              ) : (
                <Card>
                  <ul className="divide-y divide-[var(--border-hairline)]">
                    {mockNextActions.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <span className={`mt-0.5 text-lg leading-none ${priorityStyle[a.priority]}`}>
                          ●
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--text-primary)]">{a.title}</p>
                          <p className="text-sm text-[var(--text-secondary)]">{a.consultancy}</p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">
                          {a.dueDate}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </Section>
          </motion.div>

          {/* 4. Ferramentas Recomendadas */}
          <motion.div variants={staggerItem}>
            <Section title="Recommended Tools">
              {mockRecommendedTools.length === 0 ? (
                <EmptyState message="No tools available." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {mockRecommendedTools.map((t) => (
                    <Card key={t.id}>
                      <div className="mb-2 flex items-center justify-between">
                        <Badge>{t.category}</Badge>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {t.creditCost} credits
                        </span>
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{t.name}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{t.description}</p>
                    </Card>
                  ))}
                </div>
              )}
            </Section>
          </motion.div>

          {/* 5. Continue de Onde Parou */}
          <motion.div variants={staggerItem}>
            <Section title="Continue Where You Left Off">
              {mockRecentActivities.length === 0 ? (
                <EmptyState message="No recent activity." />
              ) : (
                <Card>
                  <ul className="divide-y divide-[var(--border-hairline)]">
                    {mockRecentActivities.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--bg-surface-2)] text-xs text-[var(--text-secondary)]">
                          {a.type === 'consultancy' && '📋'}
                          {a.type === 'diagnosis' && '🔍'}
                          {a.type === 'tool' && '🛠'}
                          {a.type === 'course' && '📚'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--text-primary)]">{a.title}</p>
                          <p className="text-sm text-[var(--text-secondary)]">{a.description}</p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">
                          {a.timestamp}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </Section>
          </motion.div>

          {/* 6. Cursos Recomendados */}
          <motion.div variants={staggerItem}>
            <Section title="Recommended Courses">
              {mockRecommendedCourses.length === 0 ? (
                <EmptyState message="No courses available." />
              ) : (
                <HorizontalScroller>
                  {mockRecommendedCourses.map((c) => (
                    <Card
                      key={c.id}
                      className="min-w-[240px] max-w-[280px] flex-shrink-0 snap-start"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <Badge>{levelLabel[c.level]}</Badge>
                        <span className="text-xs text-[var(--text-muted)]">{c.duration}</span>
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{c.title}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.instructor}</p>
                    </Card>
                  ))}
                </HorizontalScroller>
              )}
            </Section>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-8 lg:col-span-4">
          {/* 8. Status de Creditos (live data) */}
          <motion.div variants={staggerItem}>
            <Section title="Credit Status">
              <CreditBalanceCard />
            </Section>
          </motion.div>

          {/* 7. Recursos Bloqueados */}
          <motion.div variants={staggerItem}>
            <Section title="Locked Resources">
              {mockLockedResources.length === 0 ? (
                <EmptyState message="All resources unlocked!" />
              ) : (
                <div className="space-y-3">
                  {mockLockedResources.map((r) => (
                    <Card key={r.id} className="opacity-75">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-lg">🔒</span>
                        <div>
                          <h3 className="font-medium text-[var(--text-secondary)]">{r.name}</h3>
                          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                            {r.description}
                          </p>
                          <Badge variant="locked" className="mt-2">
                            Requires {r.requiredPlan}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Section>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
