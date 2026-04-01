import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { Skeleton } from '../ConsultoriaDetailShared';
import { fetchAIMemory, deleteAIMemory, consultancyKeys, type AIMemoryItem } from '../../services/consultorias.api.ts';
import { listMeetings, meetingKeys, type MeetingSession } from '../../../../api/meetings.ts';
import { MemoryAddForm } from './MemoryAddForm.tsx';
import { MeetingViewModal } from './MeetingViewModal.tsx';

const CATEGORY_COLORS: Record<AIMemoryItem['category'], string> = {
  personal:  'bg-[rgba(255,159,10,0.10)] text-[var(--color-warning)]',
  business:  'bg-[rgba(52,199,89,0.08)] text-[var(--color-success)]',
  goals:     'bg-[rgba(124,92,252,0.10)] text-[var(--consulting-iris,#7c5cfc)]',
  obstacles: 'bg-[rgba(255,59,48,0.08)] text-[var(--color-error)]',
  context:   'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
  custom:    'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]',
};

const CATEGORY_LABELS: Record<AIMemoryItem['category'], string> = {
  personal: 'Pessoal', business: 'Negócio', goals: 'Objetivos',
  obstacles: 'Obstáculos', context: 'Contexto', custom: 'Personalizado',
};

function formatMeetingDate(dateStr: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface ConsultoriaDetailMemoryProps { consultancyId: string; }

export function ConsultoriaDetailMemory({ consultancyId }: ConsultoriaDetailMemoryProps) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingSession | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: consultancyKeys.aiMemory(consultancyId),
    queryFn: () => fetchAIMemory(consultancyId),
  });

  const { data: meetingsData } = useQuery({
    queryKey: meetingKeys.byConsultancy(consultancyId),
    queryFn: () => listMeetings(consultancyId),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (memoryId: string) => deleteAIMemory(consultancyId, memoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultancyKeys.aiMemory(consultancyId) }),
  });

  const memory = data?.data ?? [];
  const completedMeetings = (meetingsData?.sessions ?? []).filter(
    (s) => s.status === 'done' && (s.summary || s.formatted_transcript),
  );

  const isEmpty = memory.length === 0 && completedMeetings.length === 0;

  return (
    <>
      <div className="rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🧠</span>
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">Memória da IA</span>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="text-xs text-[var(--consulting-iris,#7c5cfc)] hover:opacity-80 transition-opacity font-medium"
          >
            + Adicionar
          </button>
        </div>

        <AnimatePresence>
          {showAdd && <MemoryAddForm consultancyId={consultancyId} onClose={() => setShowAdd(false)} />}
        </AnimatePresence>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isLoading ? (
            <>{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</>
          ) : isEmpty ? (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="text-2xl opacity-40">🧠</span>
              <p className="text-[11px] text-[var(--text-muted)]">A IA aprende com cada interação</p>
            </div>
          ) : (
            <>
              {/* AI memory items */}
              {memory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-2)] border border-[var(--border-hairline)] group relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold', CATEGORY_COLORS[item.category])}>
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">{item.content}</p>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--color-error)] text-xs leading-none"
                      title="Remover"
                    >×</button>
                  </div>
                </div>
              ))}

              {/* Meeting transcription items */}
              {completedMeetings.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedMeeting(session)}
                  className="w-full text-left rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-2)] border border-[var(--border-hairline)] hover:border-[var(--border-default)] transition-colors group"
                >
                  <div className="space-y-1">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                      style={{ background: 'rgba(96,165,250,0.10)', color: '#60a5fa' }}
                    >
                      🎙️ Reunião
                    </span>
                    <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                      Reunião dia {formatMeetingDate(session.started_at ?? session.created_at)}
                    </p>
                    {session.summary && (
                      <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">
                        {session.summary}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {selectedMeeting && (
        <MeetingViewModal
          session={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </>
  );
}
