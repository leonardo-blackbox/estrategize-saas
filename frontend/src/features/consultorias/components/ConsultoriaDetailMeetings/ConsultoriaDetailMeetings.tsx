import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../../components/ui/Button.tsx';
import { Skeleton, MeetingTypeBadge, MeetingStatusBadge } from '../ConsultoriaDetailShared';
import { formatDateTime } from '../../consultorias.detail.helpers.ts';
import { fetchMeetings, summarizeMeeting, consultancyKeys } from '../../services/consultorias.api.ts';

interface ConsultoriaDetailMeetingsProps {
  consultancyId: string;
  onNewMeeting: () => void;
}

export function ConsultoriaDetailMeetings({ consultancyId, onNewMeeting }: ConsultoriaDetailMeetingsProps) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: consultancyKeys.meetings(consultancyId),
    queryFn: () => fetchMeetings(consultancyId),
  });

  const summarizeMutation = useMutation({
    mutationFn: (meetingId: string) => summarizeMeeting(consultancyId, meetingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultancyKeys.meetings(consultancyId) }),
  });

  const meetings = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-2">
            <Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Reuniões ({meetings.length})</h3>
        <Button variant="secondary" size="sm" onClick={onNewMeeting}>+ Nova Reunião</Button>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-3">
          <div className="text-3xl">📅</div>
          <p className="text-sm text-[var(--text-secondary)]">Nenhuma reunião registrada.</p>
          <Button variant="secondary" size="sm" onClick={onNewMeeting}>Agendar primeira reunião</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{meeting.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <MeetingTypeBadge type={meeting.meeting_type} />
                    <MeetingStatusBadge status={meeting.status} />
                    <span className="text-[11px] text-[var(--text-tertiary)]">{formatDateTime(meeting.scheduled_at)}</span>
                  </div>
                </div>
                {meeting.status === 'done' && !meeting.summary && (
                  <Button variant="secondary" size="xs"
                    onClick={() => summarizeMutation.mutate(meeting.id)}
                    loading={summarizeMutation.isPending && summarizeMutation.variables === meeting.id}>
                    ✦ Resumir com IA<span className="ml-1 text-[10px] opacity-60">2cr</span>
                  </Button>
                )}
              </div>
              {meeting.notes && (
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-hairline)] pt-3">{meeting.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
