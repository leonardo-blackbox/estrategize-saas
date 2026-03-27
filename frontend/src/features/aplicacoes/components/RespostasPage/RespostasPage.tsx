import { useOutletContext } from 'react-router-dom';
import type { ApplicationShellContext } from '../../../../pages/member/aplicacoes/ApplicationShell';
import { useRespostas } from '../../hooks/useRespostas';
import { useIsMobile } from '../../hooks/useIsMobile';
import { RespostasToolbar } from '../RespostasToolbar';
import { RespostasSidebar } from '../RespostasSidebar';
import { RespostasIndividualView } from '../RespostasIndividualView';
import { RespostasTableView } from '../RespostasTableView';
import { RespostasEmptyState } from '../RespostasEmptyState';
import { MainSkeleton } from '../RespostasSkeletons';

export function RespostasPage() {
  useOutletContext<ApplicationShellContext>();
  const isMobile = useIsMobile();

  const {
    application,
    responses,
    fields,
    filteredResponses,
    selectedResponse,
    selectedIndex,
    navDirection,
    viewMode,
    dateFilter,
    showUTMColumns,
    isLoading,
    isExporting,
    sidebarCollapsed,
    hasUTMData,
    mobileShowDetail,
    setViewMode,
    setDateFilter,
    setShowUTMColumns,
    setMobileShowDetail,
    setSelectedIndex,
    handleSelectResponse,
    handlePrev,
    handleNext,
    handleExport,
    deleteResponseMutation,
  } = useRespostas();

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      <RespostasToolbar
        isLoading={isLoading}
        filteredCount={filteredResponses.length}
        totalCount={responses.length}
        dateFilter={dateFilter}
        showUTMColumns={showUTMColumns}
        hasUTMData={hasUTMData}
        viewMode={viewMode}
        isExporting={isExporting}
        onDateFilterChange={(f) => {
          setDateFilter(f);
          setSelectedIndex(0);
        }}
        onToggleUTM={() => setShowUTMColumns((v) => !v)}
        onViewModeChange={setViewMode}
        onExport={handleExport}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <RespostasSidebar
          responses={filteredResponses}
          selectedIndex={selectedIndex}
          viewMode={viewMode}
          isLoading={isLoading}
          isMobile={isMobile}
          mobileShowDetail={mobileShowDetail}
          sidebarCollapsed={sidebarCollapsed}
          onSelect={(idx) => {
            setViewMode('individual');
            handleSelectResponse(idx);
            setMobileShowDetail(true);
          }}
        />

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {isMobile && viewMode === 'individual' && (
            <button
              onClick={() => setMobileShowDetail(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--accent)',
                background: 'var(--bg-surface-1)',
                borderBottom: '1px solid var(--border-hairline)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M9 11L5 7l4-4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Respostas
            </button>
          )}

          {isLoading ? (
            <MainSkeleton />
          ) : responses.length === 0 ? (
            <RespostasEmptyState slug={application?.slug ?? ''} />
          ) : viewMode === 'individual' && selectedResponse ? (
            <RespostasIndividualView
              response={selectedResponse}
              index={selectedIndex}
              total={filteredResponses.length}
              onPrev={handlePrev}
              onNext={handleNext}
              onDelete={deleteResponseMutation}
              direction={navDirection}
              showUTM={showUTMColumns}
              fields={fields}
            />
          ) : viewMode === 'tabela' ? (
            <RespostasTableView
              responses={filteredResponses}
              fields={fields}
              showUTMColumns={showUTMColumns}
              onDelete={deleteResponseMutation}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
