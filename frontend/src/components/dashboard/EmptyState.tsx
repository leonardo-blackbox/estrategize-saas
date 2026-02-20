interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border-default)] px-6 py-10 text-center">
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
