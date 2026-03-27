import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { useConsultorias } from '../../hooks/useConsultorias.ts';
import { ConsultoriasHeader } from '../ConsultoriasHeader';
import { ConsultoriasKpiRow } from '../ConsultoriasKpiRow';
import { ConsultoriasFilterBar } from '../ConsultoriasFilterBar';
import { ConsultoriasGrid } from '../ConsultoriasGrid';
import { SmartSidebar } from '../SmartSidebar';
import { CreateConsultancyWizard } from '../CreateConsultancyWizard';

export function ConsultoriasPage() {
  const {
    stats,
    filtered,
    selected,
    isLoading,
    isError,
    error,
    phaseFilter,
    setPhaseFilter,
    sortBy,
    setSortBy,
    search,
    setSearch,
    debouncedSearch,
    selectedId,
    handleSelect,
    handleArchive,
    showCreate,
    setShowCreate,
  } = useConsultorias();

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-5"
      >
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
        />

        {/* Error state */}
        {isError && (
          <motion.div
            variants={staggerItem}
            className="rounded-[var(--radius-md)] p-4 border border-[var(--border-hairline)] bg-[var(--bg-surface-1)]"
          >
            <p className="text-sm text-[var(--color-error)]">
              {(error as Error)?.message || 'Erro ao carregar consultorias.'}
            </p>
          </motion.div>
        )}

        {/* Two-column layout */}
        <motion.div variants={staggerItem} className="flex flex-col lg:flex-row gap-4 items-start">
          <ConsultoriasGrid
            consultancies={filtered}
            selectedId={selectedId}
            isLoading={isLoading}
            hasSearch={!!debouncedSearch}
            onSelect={handleSelect}
            onArchive={handleArchive}
            onCreateClick={() => setShowCreate(true)}
          />

          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <SmartSidebar selected={selected} />
          </div>
        </motion.div>
      </motion.div>

      <CreateConsultancyWizard open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
