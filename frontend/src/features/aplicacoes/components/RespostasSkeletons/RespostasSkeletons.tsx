export function SidebarSkeleton() {
  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height: 48, margin: '1px 0', background: 'var(--bg-hover)' }}
        />
      ))}
    </div>
  );
}

export function MainSkeleton() {
  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        className="animate-pulse"
        style={{ height: 20, width: 260, borderRadius: 6, background: 'var(--bg-hover)' }}
      />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            className="animate-pulse"
            style={{ height: 13, width: 180, borderRadius: 4, background: 'var(--bg-hover)' }}
          />
          <div
            className="animate-pulse"
            style={{ height: 19, width: '70%', borderRadius: 4, background: 'var(--bg-hover)' }}
          />
        </div>
      ))}
    </div>
  );
}
