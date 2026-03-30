import { useState } from 'react';
import type { MeetingSession } from '../../../../api/meetings';

interface BotSessionCardProps {
  session: MeetingSession;
}

const STATUS_CONFIG: Record<MeetingSession['status'], { label: string; classes: string; pulse?: boolean }> = {
  pending:    { label: 'Aguardando',  classes: 'bg-slate-500/10 text-slate-400' },
  joining:    { label: 'Entrando',    classes: 'bg-yellow-500/10 text-yellow-400' },
  in_call:    { label: 'Em reunião',  classes: 'bg-green-500/20 text-green-400', pulse: true },
  processing: { label: 'Processando', classes: 'bg-blue-500/10 text-blue-400' },
  done:       { label: 'Concluída',   classes: 'bg-green-500/10 text-green-500' },
  error:      { label: 'Erro',        classes: 'bg-red-500/10 text-red-400' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function calcDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return '—';
  const mins = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  return `${mins} min`;
}

export function BotSessionCard({ session }: BotSessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[session.status];

  return (
    <div
      className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] cursor-pointer hover:border-[var(--border-default)] transition-colors"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-[var(--text-tertiary)] shrink-0">{formatDate(session.created_at)}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.classes}`}>
            {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />}
            {cfg.label}
          </span>
          <span className="text-xs text-[var(--text-tertiary)] shrink-0">
            {calcDuration(session.started_at, session.ended_at)}
          </span>
        </div>
        <span className="text-xs text-[var(--text-tertiary)] truncate max-w-xs">{session.meeting_url}</span>
      </div>

      {expanded && session.status === 'done' && (
        <div className="mt-4 pt-4 border-t border-[var(--border-hairline)] space-y-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">Participantes: </span>
            {session.speakers.length > 0 ? session.speakers.join(', ') : '—'}
          </p>

          {session.summary && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--text-primary)]">Resumo</p>
              <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{session.summary}</p>
            </div>
          )}

          {session.formatted_transcript && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--text-primary)]">Transcrição</p>
              <pre className="text-xs font-mono text-[var(--text-secondary)] overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap">
                {session.formatted_transcript}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
