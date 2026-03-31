import { useEffect } from 'react';
import type { MeetingSession } from '../../../../api/meetings';

interface TranscriptSegment { speaker: string; time: string; text: string }

function parseTranscript(raw: string): TranscriptSegment[] {
  return raw.split('\n\n').filter(Boolean).map((block) => {
    const lines = block.trim().split('\n');
    const match = lines[0]?.match(/^\[(.+)\]\s*\(([^)]+)\)/);
    return {
      speaker: match?.[1] ?? 'Desconhecido',
      time: match?.[2] ?? '',
      text: lines.slice(1).join('\n').trim(),
    };
  }).filter((s) => s.text);
}

function speakerColor(name: string): string {
  const colors = ['var(--accent)', 'var(--color-warning)', 'var(--kpi-onboarding)', 'var(--kpi-risk)', 'var(--kpi-meetings)'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface TranscriptModalProps { session: MeetingSession; onClose: () => void }

export function TranscriptModal({ session, onClose }: TranscriptModalProps) {
  const segments = parseTranscript(session.formatted_transcript ?? '');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-base)]" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-hairline)] bg-[var(--bg-surface-1)]" onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Transcrição completa</p>
          <p className="text-[11px] text-[var(--text-tertiary)]">{segments.length} segmentos · {session.speakers.join(', ') || 'Locutor desconhecido'}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        {segments.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">Nenhum segmento encontrado na transcrição.</p>
        ) : segments.map((seg, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: speakerColor(seg.speaker) }}>
              {seg.speaker.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold" style={{ color: speakerColor(seg.speaker) }}>{seg.speaker}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{seg.time}</span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{seg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
