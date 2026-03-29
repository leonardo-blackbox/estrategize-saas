interface CourseStatusTabsProps {
  activeStatus: string;
  onStatusChange: (s: string) => void;
  counts: Record<string, number>;
}

const TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'published', label: 'Publicados' },
  { key: 'draft', label: 'Rascunhos' },
  { key: 'archived', label: 'Arquivados' },
];

export function CourseStatusTabs({ activeStatus, onStatusChange, counts }: CourseStatusTabsProps) {
  return (
    <div className="flex gap-4 border-b border-[var(--border-hairline)]">
      {TABS.map((tab) => {
        const isActive = activeStatus === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onStatusChange(tab.key)}
            className={[
              'pb-2 text-xs font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'border-b-2 border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {tab.label} ({counts[tab.key] ?? 0})
          </button>
        );
      })}
    </div>
  );
}
