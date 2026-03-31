import { useState, useEffect, useRef } from 'react';
import { Button } from '../../../../components/ui/Button';
import { useMeetings } from '../../hooks/useMeetings';
import { NewMeetingModal } from './NewMeetingModal';
import { BotSessionCard } from './BotSessionCard';

interface ConsultoriaDetailMeetingsProps {
  consultancyId: string;
  onNewMeeting?: () => void;
}

export function ConsultoriaDetailMeetings({ consultancyId }: ConsultoriaDetailMeetingsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { sessions, isLoading, error, createSession, isCreating, createError } = useMeetings(consultancyId);

  // Fechar modal quando a mutation concluir sem erro
  const prevCreating = useRef(false);
  useEffect(() => {
    if (prevCreating.current && !isCreating && !createError) {
      setModalOpen(false);
    }
    prevCreating.current = isCreating;
  }, [isCreating, createError]);

  function handleCreate(url: string) {
    createSession({ meeting_url: url, consultancy_id: consultancyId });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse bg-[var(--bg-surface-1)] rounded-[var(--radius-md)] border border-[var(--border-hairline)]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-md)] p-6 bg-red-500/5 border border-red-500/20 text-center space-y-2">
        <p className="text-sm text-red-400">Erro ao carregar reuniões</p>
        <p className="text-xs text-[var(--text-tertiary)]">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Reuniões ({sessions.length})
        </h3>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          Ativar bot
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-3">
          <div className="text-3xl">🎙️</div>
          <p className="text-sm text-[var(--text-secondary)]">Nenhuma reunião registrada.</p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Ative o bot Iris AI Notetaker para entrar na reunião e transcrever automaticamente.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
            Ativar bot em reunião
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <BotSessionCard key={s.id} session={s} />
          ))}
        </div>
      )}

      <NewMeetingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={isCreating}
        error={createError?.message}
      />
    </div>
  );
}
