import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { fetchConsultancy } from '../../api/consultancies.ts';
import { getDiagnosis, type Diagnosis } from '../../api/diagnoses.ts';
import { client } from '../../api/client.ts';

type Tab = 'overview' | 'diagnosis' | 'notes' | 'timeline';

const tabItems: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Visão Geral' },
  { value: 'diagnosis', label: 'Diagnóstico IA' },
  { value: 'notes', label: 'Notas & Arquivos' },
  { value: 'timeline', label: 'Histórico' },
];

const statusConfig: Record<'active' | 'archived', { label: string; badgeVariant: 'success' | 'locked' }> = {
  active: { label: 'Ativa', badgeVariant: 'success' },
  archived: { label: 'Arquivada', badgeVariant: 'locked' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn('rounded bg-[var(--bg-hover)] animate-pulse', className)} />
  );
}

function ConsultancySkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-3 w-24" />
        <span className="text-[var(--text-tertiary)]">/</span>
        <SkeletonBlock className="h-3 w-32" />
      </div>
      <div className="space-y-1.5">
        <SkeletonBlock className="h-5 w-56" />
        <SkeletonBlock className="h-3.5 w-40" />
      </div>
      <div className="flex gap-1 border-b border-[var(--border-hairline)] pb-0">
        {[80, 96, 112, 80].map((w, i) => (
          <SkeletonBlock key={i} className={`h-8 w-${w} rounded-t`} />
        ))}
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-24 w-full rounded-[var(--radius-md)]" />
        <div className="grid gap-3 sm:grid-cols-3">
          <SkeletonBlock className="h-16 rounded-[var(--radius-md)]" />
          <SkeletonBlock className="h-16 rounded-[var(--radius-md)]" />
          <SkeletonBlock className="h-16 rounded-[var(--radius-md)]" />
        </div>
      </div>
    </div>
  );
}

function DiagnosisSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="h-3.5 w-full" />
      <SkeletonBlock className="h-3.5 w-5/6" />
      <SkeletonBlock className="h-3.5 w-4/6" />
    </div>
  );
}

interface DiagnosisTabProps {
  consultancyId: string;
}

function DiagnosisTab({ consultancyId }: DiagnosisTabProps) {
  const qc = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['diagnosis', consultancyId],
    queryFn: () => getDiagnosis(consultancyId),
    enabled: !!consultancyId,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      client.post(`/api/consultancies/${consultancyId}/diagnose`).json<{ data: Diagnosis }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diagnosis', consultancyId] });
    },
  });

  if (isLoading) {
    return <DiagnosisSkeleton />;
  }

  // 404 or no diagnosis yet
  const isNotFound =
    isError &&
    ((error as Error)?.message?.includes('404') ||
      (error as Error)?.message?.toLowerCase().includes('not found') ||
      (error as Error)?.message?.toLowerCase().includes('nenhum'));

  if (isError && !isNotFound) {
    // Treat any non-404 error like "no diagnosis yet" to avoid blank screens,
    // since the endpoint returns 404 when no diagnosis exists.
    // Fall through to the "no diagnosis" UI below.
  }

  if (isError || !data?.data) {
    return (
      <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Diagnóstico IA (Método Iris)
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Nenhum diagnóstico gerado ainda.
          </p>
        </div>

        {generateMutation.isError && (
          <p className="text-[12px] text-[var(--color-error)]">
            {(generateMutation.error as Error)?.message || 'Erro ao gerar diagnóstico. Tente novamente.'}
          </p>
        )}

        <div className="space-y-1.5">
          <Button
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Gerando…' : 'Gerar Diagnóstico com IA'}
          </Button>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Isso pode levar alguns segundos e custa 1 crédito.
          </p>
        </div>
      </div>
    );
  }

  const diagnosis = data.data;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Diagnóstico IA (Método Iris)
          </h3>
          <div className="flex items-center gap-2">
            {diagnosis.is_edited && (
              <Badge variant="drip">Editado</Badge>
            )}
            <Badge variant="success">v{diagnosis.version}</Badge>
          </div>
        </div>

        {/* Executive summary */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {diagnosis.content.executiveSummary}
        </p>

        <div className="text-xs text-[var(--text-tertiary)]">
          Gerado em {formatDate(diagnosis.created_at)}
          {diagnosis.tokens_used != null ? ` · ${diagnosis.tokens_used.toLocaleString('pt-BR')} tokens` : ''}
        </div>
      </div>

      {/* Sections */}
      {diagnosis.content.sections.map((section, idx) => (
        <div
          key={idx}
          className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-2"
        >
          <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">
            {section.name}
          </h4>
          <ul className="space-y-1.5">
            {section.insights.map((insight, iIdx) => (
              <li key={iIdx} className="flex gap-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ConsultoriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const {
    data: consultancyData,
    isLoading: isConsultancyLoading,
    isError: isConsultancyError,
  } = useQuery({
    queryKey: ['consultancy', id],
    queryFn: () => fetchConsultancy(id!),
    enabled: !!id,
  });

  if (isConsultancyLoading) {
    return <ConsultancySkeleton />;
  }

  if (isConsultancyError || !consultancyData?.data) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Link to="/consultorias" className="hover:text-[var(--text-secondary)] transition-colors">
            Consultorias
          </Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">Não encontrada</span>
        </div>
        <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Consultoria não encontrada
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Esta consultoria não existe ou você não tem acesso a ela.
          </p>
          <Link to="/consultorias">
            <Button size="sm" variant="secondary">
              ← Voltar para Consultorias
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const consultancy = consultancyData.data;
  const statusCfg = statusConfig[consultancy.status];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Breadcrumb */}
      <motion.div variants={staggerItem} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Link to="/consultorias" className="hover:text-[var(--text-secondary)] transition-colors">
          Consultorias
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)] truncate max-w-[200px]">
          {consultancy.title}
        </span>
      </motion.div>

      {/* Header */}
      <motion.div variants={staggerItem}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">
              {consultancy.title}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {consultancy.client_name
                ? <>{consultancy.client_name} &middot; </>
                : null}
              Consultoria #{id?.slice(0, 8)}
            </p>
          </div>
          <Badge variant={statusCfg.badgeVariant} className="shrink-0 mt-0.5">
            {statusCfg.label}
          </Badge>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={staggerItem}
        className="flex gap-1 border-b border-[var(--border-hairline)] overflow-x-auto scrollbar-none"
      >
        {tabItems.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap border-b-2 -mb-px',
              activeTab === tab.value
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <motion.div variants={staggerItem}>
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Resumo</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {consultancy.client_name
                  ? `Consultoria estratégica para ${consultancy.client_name}.`
                  : 'Consultoria estratégica.'}
                {' '}Acesse a aba de <span className="text-[var(--text-primary)] font-medium">Diagnóstico IA</span> para ver os insights gerados.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Status', value: statusCfg.label },
                { label: 'Criada em', value: formatDate(consultancy.created_at) },
                { label: 'Atualizada em', value: formatDate(consultancy.updated_at) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
                >
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                    {item.label}
                  </div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{item.value}</div>
                </div>
              ))}
            </div>

            {consultancy.client_name && (
              <div className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Empresa
                </div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {consultancy.client_name}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diagnosis */}
        {activeTab === 'diagnosis' && id && (
          <DiagnosisTab consultancyId={id} />
        )}

        {/* Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
              <p className="text-sm text-[var(--text-secondary)]">
                Nenhuma nota ou arquivo adicionado ainda.
              </p>
              <button className="mt-3 text-xs text-[var(--text-primary)] font-medium hover:opacity-70 transition-opacity">
                + Adicionar nota
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-0">
            {/* Consultancy created event */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-[var(--accent)] mt-1.5" />
                <div className="w-px flex-1 bg-[var(--border-hairline)]" />
              </div>
              <div className="pb-4">
                <p className="text-sm text-[var(--text-primary)]">Consultoria criada</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                  {formatDate(consultancy.created_at)}
                </p>
              </div>
            </div>

            {/* Placeholder for future events */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-[var(--text-muted)] mt-1.5" />
              </div>
              <div className="pb-4">
                <p className="text-sm text-[var(--text-tertiary)] italic">
                  Histórico completo em breve.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
