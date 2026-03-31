import { useConsultorias } from '../../hooks/useConsultorias.ts';
import { ConsultoriasHeader } from '../ConsultoriasHeader';
import { ConsultoriasKpiRow } from '../ConsultoriasKpiRow';
import { ConsultoriasFilterBar } from '../ConsultoriasFilterBar';
import { ConsultoriasGrid } from '../ConsultoriasGrid';
import { CreateConsultancyWizard } from '../CreateConsultancyWizard';

export function ConsultoriasPage() {
  const {
    stats,
    filtered,
    archived,
    isLoading,
    isError,
    error,
    phaseFilter,
    setPhaseFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    search,
    setSearch,
    debouncedSearch,
    handleArchive,
    handleDelete,
    handleUnarchive,
    archivedVisible,
    setArchivedVisible,
    showCreate,
    setShowCreate,
  } = useConsultorias();

  return (
    <>
      <div className="space-y-5">
        <ConsultoriasHeader
          isLoading={isLoading}
          activeCount={stats.active}
          onCreateClick={() => setShowCreate(true)}
        />

        {!isLoading && <ConsultoriasKpiRow stats={stats} />}

        <ConsultoriasFilterBar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          phaseFilter={phaseFilter}
          onPhaseFilterChange={setPhaseFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {isError && (
          <div className="rounded-[var(--radius-md)] p-4 border border-[var(--border-hairline)] bg-[var(--bg-surface-1)]">
            <p className="text-sm text-[var(--color-error)]">
              {(error as Error)?.message || 'Erro ao carregar consultorias.'}
            </p>
          </div>
        )}

        <ConsultoriasGrid
          consultancies={filtered}
          isLoading={isLoading}
          hasSearch={!!debouncedSearch || statusFilter !== 'all' || phaseFilter !== 'all'}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onUnarchive={handleUnarchive}
          archived={archived}
          archivedVisible={archivedVisible}
          onToggleArchived={() => setArchivedVisible((v) => !v)}
          onCreateClick={() => setShowCreate(true)}
        />
      </div>

      <CreateConsultancyWizard open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
