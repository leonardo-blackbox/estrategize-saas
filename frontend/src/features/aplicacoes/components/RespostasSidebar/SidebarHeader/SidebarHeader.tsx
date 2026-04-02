interface SidebarHeaderProps {
  count: number;
  isLoading: boolean;
}

export function SidebarHeader({ count, isLoading }: SidebarHeaderProps) {
  return (
    <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-hairline)' }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {isLoading
          ? '\u2026'
          : `${count} resposta${count !== 1 ? 's' : ''}`}
      </span>
    </div>
  );
}
