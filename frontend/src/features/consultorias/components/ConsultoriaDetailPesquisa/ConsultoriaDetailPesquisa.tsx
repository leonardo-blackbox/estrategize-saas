import { useMarketResearch } from '../../hooks/useMarketResearch.ts';
import { PesquisaEmptyState } from './PesquisaEmptyState.tsx';
import { PesquisaProgress } from './PesquisaProgress.tsx';
import { PesquisaCompetitors } from './PesquisaCompetitors.tsx';
import { PesquisaReport } from './PesquisaReport.tsx';
import type { CompetitorData } from '../../../../types/market-intelligence.ts';

interface Props {
  consultancyId: string;
}

export function ConsultoriaDetailPesquisa({ consultancyId }: Props) {
  const { research, isLoading, startResearch, isStarting, manualRagIndex, isIndexing } = useMarketResearch(consultancyId);

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const status = research?.status ?? 'not_started';

  if (status === 'not_started') {
    return (
      <PesquisaEmptyState
        onStart={startResearch}
        isStarting={isStarting}
        creditsCost={5}
      />
    );
  }

  if (status === 'pending' || status.startsWith('running_')) {
    return <PesquisaProgress research={research!} />;
  }

  if (status === 'failed') {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-red-400">Pesquisa falhou: {research?.error_message ?? 'Erro desconhecido'}</p>
        <button type="button" onClick={startResearch} disabled={isStarting}
          className="text-xs px-4 py-2 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50">
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (status === 'done' && research) {
    const competitors = (research.competitors_discovered ?? []) as CompetitorData[];
    return (
      <div className="space-y-5">
        <PesquisaCompetitors competitors={competitors} />
        <PesquisaReport
          research={research}
          onRestart={startResearch}
          onRagIndex={manualRagIndex}
          isIndexing={isIndexing}
        />
      </div>
    );
  }

  return null;
}
