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

const statusLabel: Record<string, string> = {
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  completed: 'Completed',
};

const statusColor: Record<string, string> = {
  in_progress: 'bg-blue-500/20 text-blue-400',
  pending_review: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-green-500/20 text-green-400',
};

const priorityColor: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-slate-400',
};

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8">
      {/* 1. Banner estratégico */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Welcome back, {user?.user_metadata?.full_name ?? user?.email}
        </h1>
        <p className="mt-2 max-w-xl text-indigo-200">
          Your strategic consulting hub. Track consultancies, run AI diagnostics,
          and accelerate your clients&apos; growth.
        </p>
      </div>

      {/* 2-column grid on lg */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-8">
          {/* 2. Consultorias Ativas */}
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
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[c.status]}`}
                      >
                        {statusLabel[c.status]}
                      </span>
                      <span className="text-xs text-slate-500">{c.updatedAt}</span>
                    </div>
                    <h3 className="font-semibold text-white">{c.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{c.client}</p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Progress</span>
                        <span>{c.progress}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-700">
                        <div
                          className="h-1.5 rounded-full bg-indigo-500"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </HorizontalScroller>
            )}
          </Section>

          {/* 3. Próximas Ações */}
          <Section title="Next Actions">
            {mockNextActions.length === 0 ? (
              <EmptyState message="No pending actions." />
            ) : (
              <Card>
                <ul className="divide-y divide-slate-700">
                  {mockNextActions.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <span className={`mt-0.5 text-lg leading-none ${priorityColor[a.priority]}`}>
                        ●
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{a.title}</p>
                        <p className="text-sm text-slate-400">{a.consultancy}</p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-slate-500">
                        {a.dueDate}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Section>

          {/* 4. Ferramentas Recomendadas */}
          <Section title="Recommended Tools">
            {mockRecommendedTools.length === 0 ? (
              <EmptyState message="No tools available." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {mockRecommendedTools.map((t) => (
                  <Card key={t.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                        {t.category}
                      </span>
                      <span className="text-xs text-indigo-400">
                        {t.creditCost} credits
                      </span>
                    </div>
                    <h3 className="font-semibold text-white">{t.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{t.description}</p>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          {/* 5. Continue de Onde Parou */}
          <Section title="Continue Where You Left Off">
            {mockRecentActivities.length === 0 ? (
              <EmptyState message="No recent activity." />
            ) : (
              <Card>
                <ul className="divide-y divide-slate-700">
                  {mockRecentActivities.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-300">
                        {a.type === 'consultancy' && '📋'}
                        {a.type === 'diagnosis' && '🔍'}
                        {a.type === 'tool' && '🛠'}
                        {a.type === 'course' && '📚'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{a.title}</p>
                        <p className="text-sm text-slate-400">{a.description}</p>
                      </div>
                      <span className="whitespace-nowrap text-xs text-slate-500">
                        {a.timestamp}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Section>

          {/* 6. Cursos Recomendados */}
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
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                        {levelLabel[c.level]}
                      </span>
                      <span className="text-xs text-slate-500">{c.duration}</span>
                    </div>
                    <h3 className="font-semibold text-white">{c.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{c.instructor}</p>
                  </Card>
                ))}
              </HorizontalScroller>
            )}
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-8 lg:col-span-4">
          {/* 8. Status de Créditos (live data) */}
          <Section title="Credit Status">
            <CreditBalanceCard />
          </Section>

          {/* 7. Recursos Bloqueados */}
          <Section title="Locked Resources">
            {mockLockedResources.length === 0 ? (
              <EmptyState message="All resources unlocked!" />
            ) : (
              <div className="space-y-3">
                {mockLockedResources.map((r) => (
                  <Card key={r.id} className="border-slate-600/50 bg-slate-800/60">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-lg">🔒</span>
                      <div>
                        <h3 className="font-medium text-slate-300">{r.name}</h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {r.description}
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
                          Requires {r.requiredPlan}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
