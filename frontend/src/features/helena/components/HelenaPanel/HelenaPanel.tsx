import { useState } from 'react';
import { useHelenaSSE } from '../../hooks/useHelenaSSE.ts';
import { HelenaCard } from '../HelenaCard/index.ts';
import { HelenaObjecaoCard } from '../HelenaObjecaoCard/index.ts';
import type { HelenaReport } from '../../../../types/helena.ts';

interface HelenaPanelProps {
  sessionId: string;
  onClose?: () => void;
}

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <span className={`text-xs ${connected ? 'text-violet-400' : 'text-amber-400'}`}>
      {connected ? 'Conectada' : 'Reconectando...'}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-tertiary)]">
      <span className="text-2xl text-violet-400">✦</span>
      <p className="text-sm">Aguardando sugestões...</p>
    </div>
  );
}

function ReportCard({ report }: { report: HelenaReport }) {
  if (report.tipo === 'objecao') {
    return <HelenaObjecaoCard report={report} />;
  }
  return <HelenaCard report={report} />;
}

export function HelenaPanel({ sessionId, onClose }: HelenaPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const { reports, connected, unreadCount, markAllRead } = useHelenaSSE(sessionId);

  function handleExpand() {
    setMinimized(false);
    markAllRead();
  }

  if (minimized) {
    return (
      <button
        onClick={handleExpand}
        className="fixed right-4 top-20 z-50 bg-violet-600 text-white rounded-full px-3 py-2 text-sm font-medium shadow-lg flex items-center gap-1.5"
        aria-label="Expandir painel Helena"
      >
        <span>Helena</span>
        {unreadCount > 0 && (
          <span className="bg-white text-violet-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col bg-[var(--bg-surface-1)] border-l border-[var(--border-hairline)] shadow-xl"
      role="complementary"
      aria-label="Painel Helena"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-hairline)]">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${connected ? 'bg-violet-500 animate-pulse' : 'bg-gray-400'}`}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Helena</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1 rounded hover:bg-[var(--bg-surface-1)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Minimizar painel"
          >
            &#8250;
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--bg-surface-1)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Fechar painel"
            >
              &#215;
            </button>
          )}
        </div>
      </div>

      {/* Connection status */}
      <div className="px-4 py-1.5 border-b border-[var(--border-hairline)]">
        <ConnectionStatus connected={connected} />
      </div>

      {/* Cards area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {reports.length === 0 ? (
          <EmptyState />
        ) : (
          reports.map((report, index) => (
            <ReportCard key={`${report.timestamp}-${index}`} report={report} />
          ))
        )}
      </div>
    </div>
  );
}
