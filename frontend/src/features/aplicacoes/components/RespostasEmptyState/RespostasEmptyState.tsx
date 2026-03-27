interface RespostasEmptyStateProps {
  slug: string;
}

export function RespostasEmptyState({ slug }: RespostasEmptyStateProps) {
  const publicUrl = `${window.location.origin}/f/${slug}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: 64,
        gap: 16,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, opacity: 0.15 }}>📬</div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        Nenhuma resposta ainda.
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0, maxWidth: 340 }}>
        Compartilhe o link do formul&#225;rio para come&#231;ar a coletar respostas.
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderRadius: 10,
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-hairline)',
          maxWidth: 440,
          width: '100%',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}
        >
          {publicUrl}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(publicUrl)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#7c5cfc',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
          }}
        >
          Copiar
        </button>
      </div>
    </div>
  );
}
