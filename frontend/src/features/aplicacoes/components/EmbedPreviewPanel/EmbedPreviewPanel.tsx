interface EmbedPreviewPanelProps {
  embedHeight: number;
}

export function EmbedPreviewPanel({ embedHeight }: EmbedPreviewPanelProps) {
  return (
    <div
      className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      <p className="text-[13px] text-[var(--text-tertiary)]">
        Exemplo de como ficara no seu site
      </p>

      <div
        className="w-full max-w-[640px] mx-8 rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-hairline)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
        }}
      >
        <div className="p-6 space-y-2">
          {[0.7, 0.5, 0.6, 0.4].map((w, i) => (
            <div
              key={i}
              className="h-2 rounded-full"
              style={{ width: `${w * 100}%`, background: 'var(--border-hairline)' }}
            />
          ))}
        </div>

        <div
          className="mx-6 mb-4 rounded-lg flex items-center justify-center text-[13px] font-medium"
          style={{
            height: Math.min(embedHeight, 280),
            background: 'var(--accent)',
            color: 'white',
            opacity: 0.85,
          }}
        >
          Seu formulario aqui
        </div>

        <div className="p-6 pt-2 space-y-2">
          {[0.6, 0.45, 0.7].map((w, i) => (
            <div
              key={i}
              className="h-2 rounded-full"
              style={{ width: `${w * 100}%`, background: 'var(--border-hairline)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
