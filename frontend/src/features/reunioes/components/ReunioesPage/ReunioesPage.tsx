import { useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { useReunioes } from '../../hooks/useReunioes.ts';
import { ReunioesHeader } from '../ReunioesHeader/ReunioesHeader.tsx';
import { BotSessionCard } from '../../../consultorias/components/ConsultoriaDetailMeetings/BotSessionCard.tsx';
import { NewMeetingModal } from '../../../consultorias/components/ConsultoriaDetailMeetings/NewMeetingModal.tsx';
import { createMeeting, deleteMeeting, meetingKeys } from '../../../../api/meetings.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─── Empty state ──────────────────────────────────────────────────────────────
function ReunioesEmptyState({ onNewMeeting }: { onNewMeeting: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div
        className="w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center text-2xl"
        style={{ background: 'rgba(124,92,252,0.10)', border: '1px solid rgba(124,92,252,0.2)' }}
      >
        🎙️
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">Nenhuma reunião ainda</p>
        <p className="text-xs text-[var(--text-tertiary)] max-w-xs">
          Ative o bot de transcrição em uma reunião e ela aparecerá aqui.
        </p>
      </div>
      <button
        onClick={onNewMeeting}
        className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #7c5cfc, #b04aff)' }}
      >
        + Nova Reunião
      </button>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ReunioesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] animate-pulse"
        />
      ))}
    </div>
  );
}

// ─── ReunioesPage ─────────────────────────────────────────────────────────────
// Global meetings page: shows ALL meetings across all consultorias
export function ReunioesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { sessions, isLoading, totalMeetings } = useReunioes();
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (url: string) => createMeeting({ meeting_url: url }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meetingKeys.all });
      setModalOpen(false);
      toast.success('Bot ativado com sucesso.');
    },
    onError: () => toast.error('Falha ao ativar bot.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMeeting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meetingKeys.all });
      toast.success('Reunião removida.');
    },
    onError: () => toast.error('Falha ao remover reunião.'),
  });

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <ReunioesHeader
          totalMeetings={totalMeetings}
          onNewMeeting={() => setModalOpen(true)}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        {isLoading ? (
          <ReunioesSkeleton />
        ) : sessions.length === 0 ? (
          <ReunioesEmptyState onNewMeeting={() => setModalOpen(true)} />
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {sessions.map((s) => (
                <BotSessionCard
                  key={s.id}
                  session={s}
                  onDelete={() => deleteMutation.mutate(s.id)}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <NewMeetingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(url) => createMutation.mutate(url)}
        isLoading={createMutation.isPending}
        error={createMutation.error?.message}
      />
    </motion.div>
  );
}
