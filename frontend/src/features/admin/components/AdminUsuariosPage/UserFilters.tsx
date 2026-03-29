interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  planId: string;
  onPlanIdChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  plans: Array<{ id: string; name: string }>;
}

const selectClass = [
  'h-9 px-2.5 text-xs rounded-[var(--radius-sm)]',
  'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
  'text-[var(--text-primary)]',
  'focus:outline-none focus:border-[var(--border-default)]',
  'cursor-pointer',
].join(' ');

export function UserFilters({
  search,
  onSearchChange,
  planId,
  onPlanIdChange,
  status,
  onStatusChange,
  plans,
}: UserFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="search"
        placeholder="Buscar por nome ou email..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className={[
          'flex-1 min-w-[180px] h-9 px-3 text-xs rounded-[var(--radius-sm)]',
          'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
          'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
          'focus:outline-none focus:border-[var(--border-default)]',
        ].join(' ')}
      />

      <select
        value={planId}
        onChange={(e) => onPlanIdChange(e.target.value)}
        className={selectClass}
        aria-label="Filtrar por plano"
      >
        <option value="">Todos os planos</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className={selectClass}
        aria-label="Filtrar por status"
      >
        <option value="">Todos os status</option>
        <option value="active">Com plano ativo</option>
        <option value="no_plan">Sem plano</option>
        <option value="suspended">Suspensos</option>
      </select>
    </div>
  );
}
