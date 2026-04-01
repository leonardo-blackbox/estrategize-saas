import { KpiCard } from '../KpiCard';
import type { ConsultancyStats } from '../../services/consultorias.api.ts';

interface ConsultoriasKpiRowProps {
  stats: ConsultancyStats;
}

export function ConsultoriasKpiRow({ stats }: ConsultoriasKpiRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Ativas"
        value={stats.active}
        gradient="linear-gradient(135deg, #052e1e 0%, #0a4a30 100%)"
        glowColor="rgba(0,200,150,0.2)"
        accentColor="#00c896"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        }
      />
      <KpiCard
        label="Onboarding"
        value={stats.onboarding}
        gradient="linear-gradient(135deg, #051a30 0%, #0a3060 100%)"
        glowColor="rgba(59,130,246,0.2)"
        accentColor="#60a5fa"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        }
      />
      <KpiCard
        label="Reuniões / semana"
        value={stats.meetings_this_week}
        gradient="linear-gradient(135deg, #1a0a30 0%, #2d1060 100%)"
        glowColor="rgba(168,85,247,0.2)"
        accentColor="#c084fc"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        }
      />
      <KpiCard
        label="Em risco"
        value={stats.at_risk}
        gradient="linear-gradient(135deg, #2a0a0a 0%, #4a1010 100%)"
        glowColor="rgba(239,68,68,0.2)"
        accentColor="#f87171"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        }
      />
    </div>
  );
}
