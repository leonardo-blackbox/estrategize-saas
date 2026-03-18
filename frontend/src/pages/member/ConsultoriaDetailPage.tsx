import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Badge } from '../../components/ui/Badge.tsx';
import { Button } from '../../components/ui/Button.tsx';
import {
  fetchConsultancy,
  fetchMeetings,
  fetchActionItems,
  fetchDeliverables,
  fetchAIContext,
  chatWithAI,
  fetchAIMemory,
  addAIMemory,
  deleteAIMemory,
  summarizeMeeting,
  generateDeliverable,
  type Consultancy,
  type Meeting,
  type ActionItem,
  type AIMessage,
  type AIMemoryItem,
  type InsightCards,
  type ConsultancyPhase,
  type ConsultancyPriority,
  type ActionPriority,
  type DeliverableType,
  phaseConfig,
  consultancyKeys,
} from '../../api/consultancies.ts';
import { getDiagnosis, type Diagnosis } from '../../api/diagnoses.ts';
import { client } from '../../api/client.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey =
  | 'overview'
  | 'dados'
  | 'diagnosis'
  | 'jornada'
  | 'meetings'
  | 'actions'
  | 'deliverables'
  | 'ai'
  | 'mercado'
  | 'conteudo'
  | 'financeiro'
  | 'arquivos';

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: TabDef[] = [
  { key: 'overview',    label: 'Visão Geral' },
  { key: 'dados',       label: 'Dados' },
  { key: 'diagnosis',   label: 'Diagnóstico' },
  { key: 'jornada',     label: 'Jornada' },
  { key: 'meetings',    label: 'Reuniões' },
  { key: 'actions',     label: 'Plano de Ação' },
  { key: 'deliverables',label: 'Entregáveis' },
  { key: 'ai',          label: 'IA da Consultoria' },
  { key: 'mercado',     label: 'Mercado' },
  { key: 'conteudo',    label: 'Conteúdo' },
  { key: 'financeiro',  label: 'Financeiro' },
  { key: 'arquivos',    label: 'Arquivos' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string | null, fallback: string): string {
  const target = name || fallback;
  const words = target.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// ─── Skeleton primitives ──────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded bg-[var(--bg-hover)] animate-pulse', className)} />
  );
}

// ─── Score circle SVG ─────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number | null }) {
  const pct = score ?? 0;
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[100px] h-[100px]">
        <svg width="100" height="100" className="-rotate-90">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            strokeWidth="8"
            stroke="var(--consulting-progress-track)"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            strokeWidth="8"
            stroke="var(--consulting-progress-fill, var(--consulting-iris, #7c5cfc))"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-[var(--text-primary)]">
          {score != null ? `${score}%` : '—'}
        </span>
      </div>
      <span className="text-xs text-[var(--text-tertiary)]">Implementação</span>
    </div>
  );
}

// ─── Priority badge ───────────────────────────────────────────────────────────

type AnyPriority = ConsultancyPriority | ActionPriority;

function PriorityBadge({ priority }: { priority: AnyPriority | null | undefined }) {
  if (!priority) return null;
  const map: Record<AnyPriority, { label: string; cls: string }> = {
    at_risk:  { label: 'Em Risco', cls: 'bg-[rgba(255,59,48,0.10)] text-[var(--color-error)] ring-1 ring-inset ring-[rgba(255,59,48,0.20)]' },
    critical: { label: 'Crítica',  cls: 'bg-[rgba(255,59,48,0.10)] text-[var(--color-error)] ring-1 ring-inset ring-[rgba(255,59,48,0.20)]' },
    high:     { label: 'Alta',     cls: 'bg-[rgba(255,159,10,0.10)] text-[var(--color-warning)] ring-1 ring-inset ring-[rgba(255,159,10,0.20)]' },
    medium:   { label: 'Média',    cls: 'bg-[rgba(52,199,89,0.08)] text-[var(--color-success)] ring-1 ring-inset ring-[rgba(52,199,89,0.20)]' },
    normal:   { label: 'Normal',   cls: 'bg-[rgba(52,199,89,0.08)] text-[var(--color-success)] ring-1 ring-inset ring-[rgba(52,199,89,0.20)]' },
    low:      { label: 'Baixa',    cls: 'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] ring-1 ring-inset ring-[var(--border-hairline)]' },
  };
  const cfg = map[priority];
  if (!cfg) return null;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

// ─── Meeting type badge ───────────────────────────────────────────────────────

function MeetingTypeBadge({ type }: { type: Meeting['meeting_type'] }) {
  const labels: Record<Meeting['meeting_type'], string> = {
    kickoff: 'Kickoff', diagnostic: 'Diagnóstico', delivery: 'Entrega',
    checkpoint: 'Checkpoint', followup: 'Follow-up', closing: 'Encerramento',
  };
  return (
    <Badge variant="default" size="sm">{labels[type]}</Badge>
  );
}

function MeetingStatusBadge({ status }: { status: Meeting['status'] }) {
  const map: Record<Meeting['status'], { label: string; variant: 'success' | 'error' | 'default' }> = {
    scheduled: { label: 'Agendada', variant: 'default' },
    done:      { label: 'Realizada', variant: 'success' },
    cancelled: { label: 'Cancelada', variant: 'error' },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}

// ─── Insight strip ────────────────────────────────────────────────────────────

interface InsightStripProps {
  insights: InsightCards | null | undefined;
  isLoading: boolean;
}

function InsightStrip({ insights, isLoading }: InsightStripProps) {
  const cards = [
    {
      title: 'Gargalo Real',
      borderVar: '--insight-bottleneck-border',
      defaultBorder: '#ff6b35',
      content: insights?.bottleneck ?? null,
      empty: 'Diagnóstico pendente',
      icon: '⚡',
    },
    {
      title: 'Prioridades da Semana',
      borderVar: '--insight-priorities-border',
      defaultBorder: '#f5a623',
      content: null as null,
      priorities: insights?.week_priorities,
      empty: 'Nenhuma prioridade definida',
      icon: '📌',
    },
    {
      title: 'Próxima Reunião',
      borderVar: '--insight-meeting-border',
      defaultBorder: '#4A90E2',
      content: insights?.next_meeting
        ? `${insights.next_meeting.title} — ${formatDateTime(insights.next_meeting.scheduled_at)}`
        : null,
      empty: 'Sem reuniões agendadas',
      icon: '📅',
    },
    {
      title: 'Oportunidade IA',
      borderVar: '--insight-opportunity-border',
      defaultBorder: '#b04aff',
      content: insights?.ai_opportunity ?? null,
      empty: 'Execute um diagnóstico para ver oportunidades',
      icon: '✦',
      isAI: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-[var(--radius-md)] p-3.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
          style={{
            borderLeft: `4px solid var(${card.borderVar}, ${card.defaultBorder})`,
          }}
        >
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[13px]">{card.icon}</span>
                <span className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  card.isAI
                    ? 'bg-gradient-to-r from-[var(--consulting-ai-accent,#b04aff)] to-[var(--consulting-iris,#7c5cfc)] bg-clip-text text-transparent'
                    : 'text-[var(--text-tertiary)]',
                )}>
                  {card.title}
                </span>
              </div>
              {card.priorities !== undefined ? (
                card.priorities && card.priorities.length > 0 ? (
                  <ul className="space-y-1">
                    {card.priorities.slice(0, 3).map((p, i) => (
                      <li key={i} className="flex gap-1.5 text-[12px] text-[var(--text-secondary)] leading-snug">
                        <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-[var(--text-muted)] italic">{card.empty}</p>
                )
              ) : (
                <p className={cn(
                  'text-[12px] leading-relaxed',
                  card.content ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)] italic',
                )}>
                  {card.content ?? card.empty}
                </p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Rich Header ──────────────────────────────────────────────────────────────

interface RichHeaderProps {
  consultancy: Consultancy;
  onEditClick: () => void;
  onGenerateDiagnosis: () => void;
  onNewMeeting: () => void;
}

function RichHeader({ consultancy, onEditClick, onGenerateDiagnosis, onNewMeeting }: RichHeaderProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const phase = consultancy.phase;
  const phaseCfg = phase ? phaseConfig[phase] : null;

  const avatarStyle = phaseCfg
    ? { backgroundColor: `var(${phaseCfg.bgVar})`, color: `var(${phaseCfg.colorVar})` }
    : { backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' };

  const initials = getInitials(consultancy.client_name, consultancy.title);
  const isActive = consultancy.status === 'active';

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <Link to="/consultorias" className="hover:text-[var(--text-secondary)] transition-colors">
          Consultorias
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)] truncate max-w-[220px]">
          {consultancy.client_name || consultancy.title}
        </span>
      </div>

      {/* Main header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Left: avatar + info */}
        <div className="flex items-start gap-4 min-w-0">
          {/* Avatar */}
          <div
            className="w-14 h-14 shrink-0 rounded-[var(--radius-lg)] flex items-center justify-center text-lg font-bold select-none"
            style={avatarStyle}
          >
            {initials}
          </div>

          {/* Info block */}
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                {consultancy.client_name || consultancy.title}
              </h1>
              {/* Status dot */}
              <span className={cn(
                'w-2 h-2 rounded-full shrink-0',
                isActive ? 'bg-[var(--color-success)]' : 'bg-[var(--text-muted)]',
              )} title={isActive ? 'Ativa' : 'Arquivada'} />
            </div>

            {consultancy.client_name && (
              <p className="text-sm text-[var(--text-secondary)]">{consultancy.title}</p>
            )}

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {phaseCfg && (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{
                    backgroundColor: `var(${phaseCfg.bgVar})`,
                    color: `var(${phaseCfg.colorVar})`,
                  }}
                >
                  {phaseCfg.label}
                </span>
              )}
              <PriorityBadge priority={consultancy.priority} />
              {consultancy.niche && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-surface-2)] text-[var(--text-tertiary)] ring-1 ring-inset ring-[var(--border-hairline)]">
                  {consultancy.niche}
                </span>
              )}
            </div>

            {/* Strategic summary */}
            {consultancy.strategic_summary && (
              <div className="max-w-xl">
                <p className={cn(
                  'text-[12px] text-[var(--text-secondary)] leading-relaxed',
                  !summaryExpanded && 'line-clamp-2',
                )}>
                  {consultancy.strategic_summary}
                </p>
                {consultancy.strategic_summary.length > 120 && (
                  <button
                    onClick={() => setSummaryExpanded((v) => !v)}
                    className="text-[11px] text-[var(--consulting-iris,#7c5cfc)] hover:opacity-80 transition-opacity mt-0.5"
                  >
                    {summaryExpanded ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
              </div>
            )}

            {/* Credits spent */}
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <span>🪙</span>
              <span>{consultancy.credits_spent} crédito{consultancy.credits_spent !== 1 ? 's' : ''} gastos</span>
            </div>
          </div>
        </div>

        {/* Right: quick actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onEditClick}>
            Editar Dados
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={onGenerateDiagnosis}
            style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg, #7c5cfc, #b04aff))' }}
          >
            ✦ Gerar Diagnóstico
          </Button>
          <Button variant="secondary" size="sm" onClick={onNewMeeting}>
            + Nova Reunião
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

interface TabNavProps {
  active: TabKey;
  onChange: (t: TabKey) => void;
}

function TabNav({ active, onChange }: TabNavProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="flex gap-0 border-b border-[var(--border-hairline)] overflow-x-auto scrollbar-none"
    >
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap border-b-2 -mb-px shrink-0',
            active === tab.key
              ? 'border-[var(--consulting-iris,#7c5cfc)] text-[var(--consulting-iris,#7c5cfc)]'
              : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tab: Visão Geral ─────────────────────────────────────────────────────────

interface OverviewTabProps {
  consultancy: Consultancy;
  onTabChange: (t: TabKey) => void;
}

function OverviewTab({ consultancy, onTabChange }: OverviewTabProps) {
  const score = consultancy.implementation_score;

  const kfacts: { label: string; value: string }[] = [
    { label: 'Status',       value: consultancy.status === 'active' ? 'Ativa' : 'Arquivada' },
    { label: 'Criada em',    value: formatDate(consultancy.created_at) },
    { label: 'Início',       value: formatDate(consultancy.start_date) },
    { label: 'Previsão fim', value: formatDate(consultancy.end_date_estimated) },
  ];

  return (
    <div className="space-y-5">
      {/* Score + key facts */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
        {/* Score */}
        <div className="rounded-[var(--radius-md)] p-5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col items-center justify-center min-w-[140px]">
          <div className="relative">
            <ScoreCircle score={score} />
          </div>
        </div>

        {/* Key facts grid */}
        <div className="grid grid-cols-2 gap-3">
          {kfacts.map((f) => (
            <div key={f.label} className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">{f.label}</div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Real bottleneck */}
      {consultancy.real_bottleneck && (
        <div
          className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
          style={{ borderLeft: '4px solid var(--insight-bottleneck-border, #ff6b35)' }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">⚡ Gargalo Real</div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{consultancy.real_bottleneck}</p>
        </div>
      )}

      {/* Quick links */}
      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Acesso Rápido</div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'diagnosis' as TabKey,    label: '🔍 Diagnóstico IA' },
            { key: 'meetings' as TabKey,     label: '📅 Reuniões' },
            { key: 'actions' as TabKey,      label: '✅ Plano de Ação' },
            { key: 'ai' as TabKey,           label: '✦ IA da Consultoria' },
            { key: 'deliverables' as TabKey, label: '📄 Entregáveis' },
          ].map((link) => (
            <button
              key={link.key}
              onClick={() => onTabChange(link.key)}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors border border-[var(--border-hairline)]"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Dados ───────────────────────────────────────────────────────────────

function DadosTab() {
  return (
    <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col items-center justify-center text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center text-xl">🔒</div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Perfil da Consultoria</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
          Complete o perfil com modelo de negócio, tamanho do time, faturamento mensal e público-alvo.
        </p>
      </div>
      <Badge variant="drip">Disponível em breve</Badge>
    </div>
  );
}

// ─── Tab: Diagnóstico ─────────────────────────────────────────────────────────

function DiagnosisSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-5/6" />
      <Skeleton className="h-3.5 w-4/6" />
    </div>
  );
}

function DiagnosisTab({ consultancyId }: { consultancyId: string }) {
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
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

  if (isLoading) return <DiagnosisSkeleton />;

  const isNotFound =
    isError &&
    ((error as Error)?.message?.includes('404') ||
      (error as Error)?.message?.toLowerCase().includes('not found') ||
      (error as Error)?.message?.toLowerCase().includes('nenhum'));

  if (isError || !data?.data) {
    return (
      <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Diagnóstico IA (Método Iris)</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {isNotFound ? 'Nenhum diagnóstico gerado ainda.' : 'Erro ao carregar diagnóstico.'}
          </p>
        </div>
        {generateMutation.isError && (
          <p className="text-[12px] text-[var(--color-error)]">
            {(generateMutation.error as Error)?.message || 'Erro ao gerar diagnóstico. Tente novamente.'}
          </p>
        )}
        <div className="space-y-1.5">
          <Button size="sm" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Gerando…' : 'Gerar Diagnóstico com IA'}
          </Button>
          <p className="text-[11px] text-[var(--text-tertiary)]">Custa 1 crédito. Pode levar alguns segundos.</p>
        </div>
      </div>
    );
  }

  const diagnosis = data.data;

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Diagnóstico IA (Método Iris)</h3>
          <div className="flex items-center gap-2">
            {diagnosis.is_edited && <Badge variant="drip">Editado</Badge>}
            <Badge variant="success">v{diagnosis.version}</Badge>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{diagnosis.content.executiveSummary}</p>
        <div className="text-xs text-[var(--text-tertiary)]">
          Gerado em {formatDate(diagnosis.created_at)}
          {diagnosis.tokens_used != null ? ` · ${diagnosis.tokens_used.toLocaleString('pt-BR')} tokens` : ''}
        </div>
      </div>
      {diagnosis.content.sections.map((section, idx) => (
        <div key={idx} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-2">
          <h4 className="text-[13px] font-semibold text-[var(--text-primary)]">{section.name}</h4>
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

// ─── Tab: Jornada ─────────────────────────────────────────────────────────────

const JOURNEY_STAGES = [
  { id: 'contract',       label: 'Contrato',       phase: 'onboarding' as ConsultancyPhase },
  { id: 'briefing',       label: 'Briefing',        phase: 'onboarding' as ConsultancyPhase },
  { id: 'diagnosis',      label: 'Diagnóstico',     phase: 'diagnosis' as ConsultancyPhase },
  { id: 'delivery',       label: 'Entrega',         phase: 'delivery' as ConsultancyPhase },
  { id: 'implementation', label: 'Implementação',   phase: 'implementation' as ConsultancyPhase },
  { id: 'support',        label: 'Suporte',         phase: 'support' as ConsultancyPhase },
  { id: 'closing',        label: 'Encerramento',    phase: 'closed' as ConsultancyPhase },
];

function JornadaTab({ consultancy }: { consultancy: Consultancy }) {
  const currentPhase = consultancy.phase;

  const phaseOrder: ConsultancyPhase[] = ['onboarding', 'diagnosis', 'delivery', 'implementation', 'support', 'closed'];
  const currentPhaseIdx = currentPhase ? phaseOrder.indexOf(currentPhase) : -1;

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] p-5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-6">Jornada da Consultoria</h3>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-4 top-4 bottom-0 w-px bg-[var(--border-hairline)]" />
          <div className="space-y-6">
            {JOURNEY_STAGES.map((stage, idx) => {
              const stagePhaseIdx = phaseOrder.indexOf(stage.phase);
              const isDone = currentPhaseIdx > stagePhaseIdx;
              const isCurrent = currentPhase === stage.phase;
              const isPending = currentPhaseIdx < stagePhaseIdx;
              const pCfg = phaseConfig[stage.phase];

              return (
                <div key={stage.id} className="relative flex items-center gap-4 pl-10">
                  {/* Dot */}
                  <div
                    className={cn(
                      'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10',
                      isDone && 'bg-[var(--color-success)] text-white',
                      isCurrent && 'border-2 border-[var(--consulting-iris,#7c5cfc)] bg-[var(--bg-surface-2)]',
                      isPending && 'bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border-hairline)]',
                    )}
                    style={isCurrent ? { color: `var(${pCfg.colorVar})` } : undefined}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  {/* Content */}
                  <div className="flex-1 flex items-center justify-between gap-3 flex-wrap">
                    <span className={cn(
                      'text-sm font-medium',
                      isDone && 'text-[var(--text-secondary)] line-through',
                      isCurrent && 'text-[var(--text-primary)]',
                      isPending && 'text-[var(--text-muted)]',
                    )}>
                      {stage.label}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={isCurrent ? {
                        backgroundColor: `var(${pCfg.bgVar})`,
                        color: `var(${pCfg.colorVar})`,
                      } : {
                        backgroundColor: 'var(--bg-surface-2)',
                        color: isDone ? 'var(--color-success)' : 'var(--text-muted)',
                      }}
                    >
                      {isDone ? 'Concluída' : isCurrent ? 'Atual' : 'Pendente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="rounded-[var(--radius-md)] p-3.5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex items-center gap-3">
        <span className="text-base">🚀</span>
        <p className="text-xs text-[var(--text-tertiary)]">Em breve: checklist interativo por fase com tarefas e marcos.</p>
      </div>
    </div>
  );
}

// ─── Tab: Reuniões ────────────────────────────────────────────────────────────

function MeetingsTab({ consultancyId, onNewMeeting }: { consultancyId: string; onNewMeeting: () => void }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: consultancyKeys.meetings(consultancyId),
    queryFn: () => fetchMeetings(consultancyId),
  });

  const summarizeMutation = useMutation({
    mutationFn: (meetingId: string) => summarizeMeeting(consultancyId, meetingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultancyKeys.meetings(consultancyId) }),
  });

  const meetings = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Reuniões ({meetings.length})
        </h3>
        <Button variant="secondary" size="sm" onClick={onNewMeeting}>
          + Nova Reunião
        </Button>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-3">
          <div className="text-3xl">📅</div>
          <p className="text-sm text-[var(--text-secondary)]">Nenhuma reunião registrada.</p>
          <Button variant="secondary" size="sm" onClick={onNewMeeting}>Agendar primeira reunião</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{meeting.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <MeetingTypeBadge type={meeting.meeting_type} />
                    <MeetingStatusBadge status={meeting.status} />
                    <span className="text-[11px] text-[var(--text-tertiary)]">{formatDateTime(meeting.scheduled_at)}</span>
                  </div>
                </div>
                {meeting.status === 'done' && !meeting.summary && (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => summarizeMutation.mutate(meeting.id)}
                    loading={summarizeMutation.isPending && summarizeMutation.variables === meeting.id}
                  >
                    ✦ Resumir com IA
                    <span className="ml-1 text-[10px] opacity-60">2cr</span>
                  </Button>
                )}
              </div>
              {meeting.notes && (
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-hairline)] pt-3">
                  {meeting.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Plano de Ação ───────────────────────────────────────────────────────

function ActionItemCard({ item }: { item: ActionItem; consultancyId: string }) {
  return (
    <div className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-2)] border border-[var(--border-hairline)] space-y-2">
      <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{item.title}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <PriorityBadge priority={item.priority} />
        {item.due_date && (
          <span className="text-[10px] text-[var(--text-muted)]">📅 {formatDate(item.due_date)}</span>
        )}
      </div>
    </div>
  );
}

function ActionsTab({ consultancyId }: { consultancyId: string }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: consultancyKeys.actions(consultancyId),
    queryFn: () => fetchActionItems(consultancyId),
  });

  const generatePlanMutation = useMutation({
    mutationFn: () =>
      import('../../api/consultancies.ts').then((m) =>
        m.generateDeliverable(consultancyId, 'action_plan')
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultancyKeys.actions(consultancyId) }),
  });

  const actions = data?.data ?? [];
  const pending = actions.filter((a) => a.status === 'pending');
  const inProgress = actions.filter((a) => a.status === 'in_progress');
  const done = actions.filter((a) => a.status === 'done');

  const columns: { label: string; items: ActionItem[]; accent: string }[] = [
    { label: 'A fazer',       items: pending,    accent: 'var(--text-tertiary)' },
    { label: 'Em andamento',  items: inProgress, accent: 'var(--color-warning)' },
    { label: 'Concluído',     items: done,       accent: 'var(--color-success)' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-16 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Plano de Ação ({actions.length})</h3>
        <Button
          variant="gradient"
          size="sm"
          onClick={() => generatePlanMutation.mutate()}
          loading={generatePlanMutation.isPending}
          style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg, #7c5cfc, #b04aff))' }}
        >
          ✦ Gerar Plano com IA
          <span className="ml-1 text-[10px] opacity-70">4cr</span>
        </Button>
      </div>

      {actions.length === 0 ? (
        <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-3">
          <div className="text-3xl">✅</div>
          <p className="text-sm text-[var(--text-secondary)]">Nenhuma ação criada. Use a IA para gerar um plano estratégico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div key={col.label} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.accent }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {col.label}
                </span>
                <span className="ml-auto text-[11px] text-[var(--text-muted)]">{col.items.length}</span>
              </div>
              {col.items.length === 0 ? (
                <p className="text-[11px] text-[var(--text-muted)] italic">Nenhuma</p>
              ) : (
                col.items.map((item) => (
                  <ActionItemCard key={item.id} item={item} consultancyId={consultancyId} />
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Entregáveis ─────────────────────────────────────────────────────────

const DELIVERABLE_TYPES: { type: DeliverableType; label: string; credits: number }[] = [
  { type: 'executive_summary',  label: 'Resumo Executivo',     credits: 2 },
  { type: 'strategic_diagnosis', label: 'Diagnóstico Estratégico', credits: 3 },
  { type: 'action_plan',        label: 'Plano de Ação',        credits: 4 },
  { type: 'positioning_doc',    label: 'Documento de Posicionamento', credits: 3 },
  { type: 'competition_analysis', label: 'Análise de Concorrência', credits: 4 },
  { type: 'content_bank',       label: 'Banco de Conteúdo',    credits: 5 },
  { type: 'presentation',       label: 'Apresentação',         credits: 4 },
];

const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  executive_summary: 'Resumo Executivo',
  meeting_summary: 'Resumo de Reunião',
  action_plan: 'Plano de Ação',
  strategic_diagnosis: 'Diagnóstico Estratégico',
  positioning_doc: 'Posicionamento',
  content_bank: 'Banco de Conteúdo',
  competition_analysis: 'Concorrência',
  presentation: 'Apresentação',
  financial_projection: 'Projeção Financeira',
  market_research: 'Pesquisa de Mercado',
  brand_guide: 'Guia de Marca',
  custom: 'Personalizado',
};

function DeliverablesTab({ consultancyId }: { consultancyId: string }) {
  const qc = useQueryClient();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: consultancyKeys.deliverables(consultancyId),
    queryFn: () => fetchDeliverables(consultancyId),
  });

  const generateMutation = useMutation({
    mutationFn: (type: DeliverableType) => generateDeliverable(consultancyId, type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultancyKeys.deliverables(consultancyId) });
      setShowDropdown(false);
    },
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const deliverables = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Entregáveis ({deliverables.length})</h3>
        <div className="relative" ref={dropRef}>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setShowDropdown((v) => !v)}
            style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg, #7c5cfc, #b04aff))' }}
          >
            ✦ Gerar Entregável ▾
          </Button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 z-50 min-w-[240px] rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-default)] shadow-[0_8px_24px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                {DELIVERABLE_TYPES.map((dt) => (
                  <button
                    key={dt.type}
                    onClick={() => generateMutation.mutate(dt.type)}
                    disabled={generateMutation.isPending}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-left"
                  >
                    <span>{dt.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{dt.credits}cr</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {deliverables.length === 0 ? (
        <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-3">
          <div className="text-3xl">📄</div>
          <p className="text-sm text-[var(--text-secondary)]">Nenhum entregável gerado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliverables.map((d) => (
            <div key={d.id} className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" size="sm">{DELIVERABLE_TYPE_LABELS[d.type]}</Badge>
                  {d.ai_generated && <Badge variant="accent" size="sm">✦ IA</Badge>}
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{d.title}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{formatDate(d.created_at)} · v{d.version}</p>
              </div>
              <Button variant="secondary" size="xs">Ver</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: IA da Consultoria ───────────────────────────────────────────────────

interface ChatMessage extends AIMessage {
  id: string;
  credits_used?: number;
  isError?: boolean;
}

function AiTab({ consultancyId, clientName }: { consultancyId: string; clientName: string | null }) {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryContent, setMemoryContent] = useState('');
  const [memoryCategory, setMemoryCategory] = useState<AIMemoryItem['category']>('context');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: memoryData, isLoading: memoryLoading } = useQuery({
    queryKey: consultancyKeys.aiMemory(consultancyId),
    queryFn: () => fetchAIMemory(consultancyId),
  });

  const addMemoryMutation = useMutation({
    mutationFn: () => addAIMemory(consultancyId, { category: memoryCategory, title: memoryTitle, content: memoryContent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultancyKeys.aiMemory(consultancyId) });
      setShowAddMemory(false);
      setMemoryTitle('');
      setMemoryContent('');
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: (memoryId: string) => deleteAIMemory(consultancyId, memoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultancyKeys.aiMemory(consultancyId) }),
  });

  const memory = memoryData?.data ?? [];

  // Initial greeting
  useEffect(() => {
    const name = clientName || 'esta consultoria';
    setMessages([{
      id: 'greeting',
      role: 'assistant',
      content: `Olá! Sou a IA dedicada desta consultoria. Conheço todos os detalhes de ${name}. Como posso ajudar?`,
      created_at: new Date().toISOString(),
    }]);
  }, [clientName]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Build history (last 20, exclude greeting)
    const history: AIMessage[] = messages
      .filter((m) => m.id !== 'greeting')
      .slice(-20)
      .map(({ role, content: c, created_at }) => ({ role, content: c, created_at }));

    try {
      const res = await chatWithAI(consultancyId, content, history);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        created_at: new Date().toISOString(),
        credits_used: res.credits_used,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Erro ao processar sua mensagem. Tente novamente.',
        created_at: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, messages, consultancyId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions: { label: string; prompt: string; credits: number }[] = [
    { label: 'Gerar plano de ação',  prompt: 'Gere um plano de ação estratégico detalhado para esta consultoria.', credits: 4 },
    { label: 'Resumir status',       prompt: 'Resuma o status atual desta consultoria em bullet points.', credits: 1 },
    { label: 'Apontar gargalo',      prompt: 'Qual é o principal gargalo desta consultoria agora?', credits: 1 },
    { label: 'Sugerir conteúdo',     prompt: 'Sugira pautas de conteúdo relevantes para este cliente.', credits: 2 },
  ];

  const memoryCategoryColors: Record<AIMemoryItem['category'], string> = {
    personal: 'bg-[rgba(255,159,10,0.10)] text-[var(--color-warning)]',
    business: 'bg-[rgba(52,199,89,0.08)] text-[var(--color-success)]',
    goals: 'bg-[rgba(124,92,252,0.10)] text-[var(--consulting-iris,#7c5cfc)]',
    obstacles: 'bg-[rgba(255,59,48,0.08)] text-[var(--color-error)]',
    context: 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
    custom: 'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]',
  };

  const memoryCategoryLabels: Record<AIMemoryItem['category'], string> = {
    personal: 'Pessoal', business: 'Negócio', goals: 'Objetivos',
    obstacles: 'Obstáculos', context: 'Contexto', custom: 'Personalizado',
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[560px]">
      {/* LEFT: Chat */}
      <div className="flex-1 flex flex-col rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] overflow-hidden min-w-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 420 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2.5',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              {/* Avatar */}
              {msg.role === 'assistant' && (
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg,#7c5cfc,#b04aff))', color: 'white' }}
                >
                  ✦
                </div>
              )}
              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[75%] px-3.5 py-2.5 rounded-[var(--radius-md)] text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? msg.isError
                      ? 'bg-[rgba(255,59,48,0.08)] text-[var(--color-error)] border border-[rgba(255,59,48,0.20)]'
                      : 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]'
                    : 'text-white',
                )}
                style={msg.role === 'user' ? { background: 'var(--consulting-ai-gradient, linear-gradient(135deg,#7c5cfc,#b04aff))' } : undefined}
              >
                {msg.content}
                {msg.credits_used != null && msg.credits_used > 0 && (
                  <span className="block mt-1 text-[10px] opacity-50">🪙 {msg.credits_used} crédito{msg.credits_used !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          ))}

          {/* Thinking dots */}
          {isThinking && (
            <div className="flex gap-2.5 flex-row">
              <div
                className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg,#7c5cfc,#b04aff))', color: 'white' }}
              >
                ✦
              </div>
              <div className="px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-2)] flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]"
                    style={{ animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div className="px-4 py-2 border-t border-[var(--border-hairline)] flex gap-2 overflow-x-auto scrollbar-none">
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              onClick={() => sendMessage(qa.prompt)}
              disabled={isThinking}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] border border-[var(--border-hairline)] transition-colors disabled:opacity-40"
            >
              {qa.label}
              <span className="text-[10px] opacity-50">{qa.credits}cr</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[var(--border-hairline)] flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem… (Enter para enviar, Shift+Enter para nova linha)"
            rows={1}
            className="flex-1 resize-none rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-3 py-2.5 ring-1 ring-inset ring-[var(--border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--consulting-iris,#7c5cfc)] transition-all"
            style={{ minHeight: 40, maxHeight: 120 }}
            disabled={isThinking}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isThinking}
            style={{ background: 'var(--consulting-iris, #7c5cfc)' }}
          >
            ↑
          </Button>
        </div>
      </div>

      {/* RIGHT: AI Memory panel */}
      <div className="lg:w-80 shrink-0 rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🧠</span>
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">Memória da IA</span>
          </div>
          <button
            onClick={() => setShowAddMemory((v) => !v)}
            className="text-xs text-[var(--consulting-iris,#7c5cfc)] hover:opacity-80 transition-opacity font-medium"
          >
            + Adicionar
          </button>
        </div>

        {/* Add memory form */}
        <AnimatePresence>
          {showAddMemory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-3 space-y-2 border-b border-[var(--border-hairline)] bg-[var(--bg-surface-2)]">
                <select
                  value={memoryCategory}
                  onChange={(e) => setMemoryCategory(e.target.value as AIMemoryItem['category'])}
                  className="w-full rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[12px] text-[var(--text-primary)] px-2.5 py-1.5 ring-1 ring-inset ring-[var(--border-default)] focus:outline-none focus:ring-[var(--consulting-iris,#7c5cfc)]"
                >
                  {(['personal', 'business', 'goals', 'obstacles', 'context', 'custom'] as AIMemoryItem['category'][]).map((c) => (
                    <option key={c} value={c}>{memoryCategoryLabels[c]}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Título"
                  value={memoryTitle}
                  onChange={(e) => setMemoryTitle(e.target.value)}
                  className="w-full rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-2.5 py-1.5 ring-1 ring-inset ring-[var(--border-default)] focus:outline-none focus:ring-[var(--consulting-iris,#7c5cfc)]"
                />
                <textarea
                  placeholder="Conteúdo…"
                  value={memoryContent}
                  onChange={(e) => setMemoryContent(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-2.5 py-1.5 ring-1 ring-inset ring-[var(--border-default)] focus:outline-none focus:ring-[var(--consulting-iris,#7c5cfc)]"
                />
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    onClick={() => addMemoryMutation.mutate()}
                    disabled={!memoryTitle.trim() || !memoryContent.trim()}
                    loading={addMemoryMutation.isPending}
                    style={{ background: 'var(--consulting-iris, #7c5cfc)' }}
                  >
                    Salvar
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setShowAddMemory(false)}>Cancelar</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memory list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {memoryLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : memory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-center">
              <span className="text-2xl opacity-40">🧠</span>
              <p className="text-[11px] text-[var(--text-muted)]">A IA aprende com cada interação</p>
            </div>
          ) : (
            memory.map((item) => (
              <div
                key={item.id}
                className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-2)] border border-[var(--border-hairline)] group relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold', memoryCategoryColors[item.category])}>
                        {memoryCategoryLabels[item.category]}
                      </span>
                    </div>
                    <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">{item.content}</p>
                  </div>
                  <button
                    onClick={() => deleteMemoryMutation.mutate(item.id)}
                    disabled={deleteMemoryMutation.isPending}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--color-error)] text-xs leading-none"
                    title="Remover"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Coming soon tab ──────────────────────────────────────────────────────────

interface ComingSoonTabProps {
  icon: string;
  title: string;
  description: string;
}

function ComingSoonTab({ icon, title, description }: ComingSoonTabProps) {
  return (
    <div className="rounded-[var(--radius-md)] p-10 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col items-center justify-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-2)] flex items-center justify-center text-2xl">{icon}</div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs">{description}</p>
      </div>
      <Badge variant="drip" size="sm">Em desenvolvimento</Badge>
    </div>
  );
}

// ─── Page skeleton ────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-24" />
        <span className="text-[var(--text-tertiary)]">/</span>
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-start gap-4">
        <Skeleton className="w-14 h-14 shrink-0 rounded-[var(--radius-lg)]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[var(--radius-md)]" />
        ))}
      </div>
      <div className="flex gap-0 border-b border-[var(--border-hairline)]">
        {[80, 60, 80, 60, 70, 90, 80, 110, 70, 80, 80, 70].map((w, i) => (
          <Skeleton key={i} className={`h-8 w-${w} rounded-t mx-1`} />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ConsultoriaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const {
    data: consultancyData,
    isLoading: consultancyLoading,
    isError: consultancyError,
  } = useQuery({
    queryKey: consultancyKeys.detail(id!),
    queryFn: () => fetchConsultancy(id!),
    enabled: !!id,
  });

  const {
    data: aiContextData,
    isLoading: aiContextLoading,
  } = useQuery({
    queryKey: consultancyKeys.aiContext(id!),
    queryFn: () => fetchAIContext(id!),
    enabled: !!id,
    // Don't block the UI — insights are optional enrichment
    retry: false,
    staleTime: 60_000,
  });

  const qc = useQueryClient();

  const generateMutationHeader = useMutation({
    mutationFn: () =>
      client.post(`/api/consultancies/${id}/diagnose`).json<{ data: Diagnosis }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diagnosis', id] });
      setActiveTab('diagnosis');
    },
  });

  if (consultancyLoading) return <PageSkeleton />;

  if (consultancyError || !consultancyData?.data) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Link to="/consultorias" className="hover:text-[var(--text-secondary)] transition-colors">
            Consultorias
          </Link>
          <span>/</span>
          <span className="text-[var(--text-secondary)]">Não encontrada</span>
        </div>
        <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">Consultoria não encontrada</p>
          <p className="text-sm text-[var(--text-secondary)]">Esta consultoria não existe ou você não tem acesso a ela.</p>
          <Link to="/consultorias">
            <Button size="sm" variant="secondary">← Voltar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const consultancy = consultancyData.data;
  const insights = aiContextData?.insights ?? null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-6xl mx-auto space-y-6 pb-16"
    >
      {/* Rich header */}
      <motion.div variants={staggerItem}>
        <RichHeader
          consultancy={consultancy}
          onEditClick={() => navigate(`/consultorias/${id}/editar`)}
          onGenerateDiagnosis={() => generateMutationHeader.mutate()}
          onNewMeeting={() => setActiveTab('meetings')}
        />
      </motion.div>

      {/* Insight strip */}
      <motion.div variants={staggerItem}>
        <InsightStrip insights={insights} isLoading={aiContextLoading} />
      </motion.div>

      {/* Tab navigation */}
      <motion.div variants={staggerItem}>
        <TabNav active={activeTab} onChange={setActiveTab} />
      </motion.div>

      {/* Tab content */}
      <motion.div variants={staggerItem}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab consultancy={consultancy} onTabChange={setActiveTab} />
            )}
            {activeTab === 'dados' && <DadosTab />}
            {activeTab === 'diagnosis' && id && <DiagnosisTab consultancyId={id} />}
            {activeTab === 'jornada' && (
              <JornadaTab consultancy={consultancy} />
            )}
            {activeTab === 'meetings' && id && (
              <MeetingsTab consultancyId={id} onNewMeeting={() => {/* modal future */}} />
            )}
            {activeTab === 'actions' && id && (
              <ActionsTab consultancyId={id} />
            )}
            {activeTab === 'deliverables' && id && (
              <DeliverablesTab consultancyId={id} />
            )}
            {activeTab === 'ai' && id && (
              <AiTab consultancyId={id} clientName={consultancy.client_name} />
            )}
            {activeTab === 'mercado' && (
              <ComingSoonTab
                icon="📊"
                title="Inteligência de Mercado"
                description="Análise de concorrência, benchmarks e tendências do setor integrados ao perfil da consultoria."
              />
            )}
            {activeTab === 'conteudo' && (
              <ComingSoonTab
                icon="✍️"
                title="Hub de Conteúdo"
                description="Sugestões e banco de conteúdo estratégico gerado por IA com base no nicho e objetivos do cliente."
              />
            )}
            {activeTab === 'financeiro' && (
              <ComingSoonTab
                icon="💰"
                title="Painel Financeiro"
                description="Projeções de receita, margens e marcos financeiros da consultoria em tempo real."
              />
            )}
            {activeTab === 'arquivos' && (
              <ComingSoonTab
                icon="🗂️"
                title="Repositório de Arquivos"
                description="Upload e organização de contratos, briefings, apresentações e todos os materiais da consultoria."
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
