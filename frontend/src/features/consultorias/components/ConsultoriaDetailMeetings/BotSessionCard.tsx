import { useState } from 'react';
import type { MeetingSession } from '../../../../api/meetings';
import { Button } from '../../../../components/ui/Button';
import { TranscriptModal } from './TranscriptModal';

interface BotSessionCardProps {
  session: MeetingSession;
  onDelete?: () => void;
}

const STATUS_CONFIG: Record<
  MeetingSession['status'],
  { label: string; description: string; classes: string; pulse?: boolean; spinner?: boolean }
> = {
  pending:    {
    label: 'Aguardando',
    description: 'Bot criado. Aguardando entrar na reunião…',
    classes: 'bg-slate-500/10 text-slate-400',
  },
  joining:    {
    label: 'Entrando',
    description: 'O bot está tentando entrar na sala…',
    classes: 'bg-yellow-500/10 text-yellow-400',
    spinner: true,
  },
  in_call:    {
    label: 'Gravando',
    description: 'Bot ativo na reunião. Transcrevendo em tempo real.',
    classes: 'bg-green-500/20 text-green-400',
    pulse: true,
  },
  processing: {
    label: 'Processando',
    description: 'Reunião encerrada. IA analisando transcrição…',
    classes: 'bg-blue-500/10 text-blue-400',
    spinner: true,
  },
  done:       {
    label: 'Concluída',
    description: 'Análise pronta. Clique para ver resumo.',
    classes: 'bg-emerald-500/10 text-emerald-500',
  },
  error:      {
    label: 'Erro',
    description: 'Falha ao processar. Tente novamente.',
    classes: 'bg-red-500/10 text-red-400',
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function calcDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return null as unknown as string;
  const mins = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  return `${mins} min`;
}

export function BotSessionCard({ session, onDelete }: BotSessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const cfg = STATUS_CONFIG[session.status];
  const duration = calcDuration(session.started_at, session.ended_at);
  const isTerminal = session.status === 'done' || session.status === 'error';

  return (
    <div
      className={`rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border transition-colors ${
        isTerminal ? 'cursor-pointer hover:border-[var(--border-default)]' : 'cursor-default'
      } border-[var(--border-hairline)]`}
      onClick={() => isTerminal && setExpanded((v) => !v)}
    >
      {/* ─── Header row ─── */}
      <div className="flex items-center gap-3 p-4 flex-wrap">
        <span className="text-xs text-[var(--text-tertiary)] shrink-0">{formatDate(session.created_at)}</span>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.classes}`}>
          {cfg.spinner && (
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          )}
          {cfg.pulse && !cfg.spinner && (
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
          )}
          {cfg.label}
        </span>

        {/* Status description */}
        <span className="text-xs text-[var(--text-tertiary)]">{cfg.description}</span>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          {duration && <span className="text-xs text-[var(--text-tertiary)]">{duration}</span>}
          {session.speakers.length > 0 && (
            <span className="text-xs text-[var(--text-secondary)]">{session.speakers.join(', ')}</span>
          )}
          {isTerminal && (
            <svg
              className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {onDelete && (
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {confirmDelete ? (
                <>
                  <span className="text-xs text-[var(--text-tertiary)]">Confirmar?</span>
                  <Button variant="destructive" size="sm" onClick={onDelete}>Sim</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Não</Button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1 rounded text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Excluir reunião"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Expanded: summary + indicators + transcript ─── */}
      {expanded && session.status === 'done' && (
        <div
          className="px-4 pb-4 pt-0 border-t border-[var(--border-hairline)] space-y-4 mt-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pt-4 space-y-4">
            {/* Status indicators */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${session.formatted_transcript ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]'}`}>
                {session.formatted_transcript ? '✓' : '✗'} Transcrição
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${session.summary ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]'}`}>
                {session.summary ? '✓' : '✗'} Resumo IA
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${session.formatted_transcript ? 'bg-blue-500/10 text-blue-400' : 'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]'}`}>
                {session.formatted_transcript ? '✓' : '✗'} Indexado no RAG
              </span>
            </div>

            {!session.formatted_transcript && (
              <p className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-surface-2)] rounded-[var(--radius-sm)] px-3 py-2">
                Nenhuma transcrição foi capturada — a reunião pode ter sido muito curta ou o bot não conseguiu gravar áudio.
              </p>
            )}

            {session.summary && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Resumo da reunião</p>
                <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {session.summary}
                </p>
              </div>
            )}

            {session.formatted_transcript && (
              <Button variant="secondary" size="sm" onClick={() => setShowTranscript(true)}>
                Ver transcrição completa →
              </Button>
            )}
          </div>
        </div>
      )}

      {showTranscript && session.formatted_transcript && (
        <TranscriptModal session={session} onClose={() => setShowTranscript(false)} />
      )}

      {/* ─── Expanded: error detail ─── */}
      {expanded && session.status === 'error' && (
        <div className="px-4 pb-4 border-t border-[var(--border-hairline)] pt-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-red-400">
            Ocorreu um erro ao processar esta reunião. Verifique se o bot conseguiu entrar e se a reunião durou tempo suficiente para gerar transcrição.
          </p>
        </div>
      )}
    </div>
  );
}
