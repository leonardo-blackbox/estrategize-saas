import { useState, useEffect } from 'react';
import { cn } from '../../../../lib/cn.ts';
import type { MeetingSession } from '../../../../api/meetings.ts';

interface MeetingViewModalProps {
  session: MeetingSession;
  onClose: () => void;
}

type ModalTab = 'summary' | 'transcript';

function formatMeetingDate(dateStr: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function MeetingViewModal({ session, onClose }: MeetingViewModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('summary');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dateLabel = formatMeetingDate(session.started_at ?? session.created_at);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-[var(--radius-lg)] shadow-2xl"
        style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-default)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <span className="text-base">🎙️</span>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Reunião dia {dateLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-hairline)] px-5">
          {(['summary', 'transcript'] as ModalTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-1 py-2.5 mr-5 text-xs font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-[var(--consulting-iris,#7c5cfc)] text-[var(--consulting-iris,#7c5cfc)]'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              )}
            >
              {tab === 'summary' ? 'Resumo da reunião' : 'Transcrição'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'summary' ? (
            session.summary ? (
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {session.summary}
              </p>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] italic">Resumo não disponível.</p>
            )
          ) : (
            session.formatted_transcript ? (
              <pre className="text-[12px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-mono">
                {session.formatted_transcript}
              </pre>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] italic">Transcrição não disponível.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
