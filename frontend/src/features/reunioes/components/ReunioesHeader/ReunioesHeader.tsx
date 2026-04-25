import { Link } from 'react-router-dom';

interface ReunioesHeaderProps {
  totalMeetings: number;
  onNewMeeting: () => void;
}

export function ReunioesHeader({ totalMeetings, onNewMeeting }: ReunioesHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Link to="/ferramentas" className="hover:text-[var(--text-secondary)] transition-colors">
            ← Ferramentas
          </Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">Reuniões</span>
        </div>
        <h1
          className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-none"
          style={{
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Reuniões
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {totalMeetings === 0
            ? 'Nenhuma reunião registrada.'
            : `${totalMeetings} reunião${totalMeetings !== 1 ? 'ões' : ''} registrada${totalMeetings !== 1 ? 's' : ''}.`}
        </p>
      </div>
      <button
        onClick={onNewMeeting}
        className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium
          bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]
          text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors"
      >
        + Nova Reunião
      </button>
    </div>
  );
}
