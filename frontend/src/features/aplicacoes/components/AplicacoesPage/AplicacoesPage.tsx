import { useAplicacoes } from '../../hooks/useAplicacoes.ts';
import { AplicacoesHeader } from '../AplicacoesHeader/index.ts';
import { AplicacoesToolbar } from '../AplicacoesToolbar/index.ts';
import { AplicacoesGrid } from '../AplicacoesGrid/index.ts';
import { AplicacaoCreateModal } from '../AplicacaoCreateModal/index.ts';
import { AplicacaoDeleteModal } from '../AplicacaoDeleteModal/index.ts';
import { AplicacaoTemplateModal } from '../AplicacaoTemplateModal/index.ts';

export function AplicacoesPage() {
  const {
    applications,
    filtered,
    templates,
    isLoading,
    isError,
    error,
    activeFilter,
    setActiveFilter,
    search,
    setSearch,
    clearFilters,
    createOpen,
    setCreateOpen,
    deleteTarget,
    setDeleteTarget,
    handleConfirmDelete,
    isDeleting,
    handleDuplicate,
    showTemplateModal,
    setShowTemplateModal,
    handleCreateFromTemplate,
    isCreatingFromTemplate,
  } = useAplicacoes();

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AplicacoesHeader
          onCreateClick={() => setCreateOpen(true)}
          onTemplatesClick={() => setShowTemplateModal(true)}
        />

        <AplicacoesToolbar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          search={search}
          onSearchChange={setSearch}
          applications={applications}
        />

        <AplicacoesGrid
          filtered={filtered}
          allCount={applications.length}
          isLoading={isLoading}
          isError={isError}
          error={error as Error | null}
          search={search}
          activeFilter={activeFilter}
          onCreateClick={() => setCreateOpen(true)}
          onDuplicate={handleDuplicate}
          onDelete={(id) => setDeleteTarget(id)}
          onClearFilters={clearFilters}
        />
      </div>

      <AplicacaoCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <AplicacaoDeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      {showTemplateModal && (
        <AplicacaoTemplateModal
          templates={templates}
          onSelect={handleCreateFromTemplate}
          onClose={() => setShowTemplateModal(false)}
          isCreating={isCreatingFromTemplate}
        />
      )}
    </div>
  );
}
