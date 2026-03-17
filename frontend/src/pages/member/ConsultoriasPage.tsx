import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/cn.ts';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Modal } from '../../components/ui/Modal.tsx';
import {
  fetchConsultancies,
  createConsultancy,
  updateConsultancy,
  type Consultancy,
  type ConsultancyStats,
  type ConsultancyPhase,
  type ConsultancyTemplate,
  phaseConfig,
  templateConfig,
  consultancyKeys,
} from '../../api/consultancies.ts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function relativeFuture(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = then - now;
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffDay < 0) return 'Atrasado';
  if (diffDay === 0) return 'Hoje';
  if (diffDay === 1) return 'Amanhã';
  if (diffDay < 7) return `Em ${diffDay} dias`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

type SortOption = 'recent' | 'priority' | 'progress' | 'alpha';
type PhaseFilter = ConsultancyPhase | 'all';

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const phaseFilterLabels: { value: PhaseFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'diagnosis', label: 'Diagnóstico' },
  { value: 'delivery', label: 'Entrega' },
  { value: 'implementation', label: 'Implementação' },
  { value: 'support', label: 'Suporte' },
  { value: 'closed', label: 'Encerrada' },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorVar: string;
  bgVar: string;
}

function KpiCard({ label, value, icon, colorVar, bgVar }: KpiCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      className="flex items-center gap-3 rounded-[var(--radius-md)] p-4 border border-[var(--border-hairline)] bg-[var(--bg-surface-1)]"
      style={{ borderLeftColor: `var(${colorVar})`, borderLeftWidth: 2 }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
        style={{ background: `var(${bgVar})`, color: `var(${colorVar})` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[22px] font-bold leading-none text-[var(--text-primary)]">{value}</p>
        <p className="mt-0.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Phase Badge ──────────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: ConsultancyPhase | null }) {
  if (!phase) return null;
  const cfg = phaseConfig[phase];
  return (
    <span
      className="inline-flex items-center rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold tracking-tight whitespace-nowrap"
      style={{
        color: `var(${cfg.colorVar})`,
        background: `var(${cfg.bgVar})`,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── ConsultancyCard ──────────────────────────────────────────────────────────

interface CardProps {
  consultancy: Consultancy;
  selected: boolean;
  onSelect: (c: Consultancy) => void;
  onArchive: (id: string) => void;
}

function ConsultancyCard({ consultancy: c, selected, onSelect, onArchive }: CardProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const phase = c.phase ?? 'onboarding';
  const phaseCfg = phaseConfig[phase];
  const avatarColor = `var(${phaseCfg.colorVar})`;
  const avatarBg = `var(${phaseCfg.bgVar})`;

  return (
    <motion.div
      variants={staggerItem}
      layout
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(c)}
      className={cn(
        'relative rounded-[var(--radius-md)] p-4 border cursor-pointer overflow-hidden',
        'transition-colors duration-150',
        selected
          ? 'border-[var(--consulting-iris)] bg-[var(--consulting-iris-subtle)]'
          : 'border-[var(--border-hairline)] bg-[var(--bg-surface-1)] hover:border-[var(--border-default)] hover:bg-[var(--bg-hover)]',
      )}
    >
      {/* Hover quick actions overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-3 py-2 bg-gradient-to-t from-[var(--bg-surface-1)] to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => navigate(`/consultorias/${c.id}`)}
              className="flex-1 rounded-[var(--radius-sm)] py-1 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--bg-surface-2)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              Abrir
            </button>
            <button
              onClick={() => navigate(`/consultorias/${c.id}/ai`)}
              className="flex-1 rounded-[var(--radius-sm)] py-1 text-[11px] font-semibold text-white transition-colors"
              style={{ background: 'var(--consulting-ai-gradient)' }}
            >
              IA Dedicada
            </button>
            <button
              onClick={() => onArchive(c.id)}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-surface-2)] hover:text-[var(--color-error)] transition-colors"
            >
              Arquivar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card body */}
      <div className="flex items-start gap-3 pb-8">
        {/* Avatar */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[13px] font-bold"
          style={{ background: avatarBg, color: avatarColor }}
        >
          {initials(c.client_name)}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Client + phase */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                {c.client_name ?? '—'}
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate leading-tight mt-0.5">
                {c.title}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <PhaseBadge phase={c.phase} />
              {(c.priority === 'critical' || c.priority === 'high') && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                    c.priority === 'critical'
                      ? 'bg-[rgba(255,59,48,0.12)] text-[var(--color-error)]'
                      : 'bg-[rgba(255,159,10,0.12)] text-[var(--color-warning)]',
                  )}
                >
                  {c.priority === 'critical' ? 'Crítico' : 'Alto'}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {c.implementation_score !== null && (
            <div>
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{ background: 'var(--consulting-progress-track)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, c.implementation_score))}%`,
                    background: 'var(--consulting-progress-fill)',
                  }}
                />
              </div>
              <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">
                {c.implementation_score}% implementado
              </p>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {c.niche && (
              <span className="inline-flex items-center rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--text-muted)] bg-[var(--bg-surface-2)] ring-1 ring-inset ring-[var(--border-hairline)]">
                {c.niche}
              </span>
            )}
            {c.next_meeting_at && (
              <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5">
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                {relativeFuture(c.next_meeting_at)}
              </span>
            )}
            {c.credits_spent > 0 && (
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-0.5">
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
                {c.credits_spent}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── SmartSidebar ─────────────────────────────────────────────────────────────

function SmartSidebar({ selected }: { selected: Consultancy | null }) {
  return (
    <div className="sticky top-4 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] overflow-hidden">
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[15px] font-semibold text-[var(--text-primary)] leading-tight">
                  {selected.client_name ?? '—'}
                </p>
                <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 truncate max-w-[200px]">
                  {selected.title}
                </p>
              </div>
              <PhaseBadge phase={selected.phase} />
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              {selected.implementation_score !== null && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] p-2.5">
                  <p className="text-[18px] font-bold text-[var(--text-primary)]">
                    {selected.implementation_score}%
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Implementação</p>
                </div>
              )}
              {selected.credits_spent > 0 && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] p-2.5">
                  <p className="text-[18px] font-bold text-[var(--text-primary)]">
                    {selected.credits_spent}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Créditos usados</p>
                </div>
              )}
              {selected.next_meeting_at && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] p-2.5 col-span-2">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                    {relativeFuture(selected.next_meeting_at)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Próxima reunião</p>
                </div>
              )}
            </div>

            {/* Real bottleneck */}
            {selected.real_bottleneck && (
              <div
                className="rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] p-3"
                style={{ borderLeft: '2px solid var(--color-warning)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-warning)] mb-1">
                  Gargalo Real
                </p>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  {selected.real_bottleneck}
                </p>
              </div>
            )}

            {/* CTA */}
            <Link to={`/consultorias/${selected.id}`}>
              <Button variant="secondary" size="sm" fullWidth>
                Abrir Central da Cliente →
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center"
          >
            <div className="h-10 w-10 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center">
              <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">
              ← Selecione uma consultoria para ver detalhes
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CreateConsultancyWizard ──────────────────────────────────────────────────

interface WizardState {
  template: ConsultancyTemplate | null;
  title: string;
  client_name: string;
  niche: string;
  instagram: string;
  problem: string;
  tried: string;
  goal90: string;
}

const WIZARD_INITIAL: WizardState = {
  template: null,
  title: '',
  client_name: '',
  niche: '',
  instagram: '',
  problem: '',
  tried: '',
  goal90: '',
};

interface WizardProps {
  open: boolean;
  onClose: () => void;
}

function CreateConsultancyWizard({ open, onClose }: WizardProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(WIZARD_INITIAL);
  const [titleError, setTitleError] = useState('');
  const [mutError, setMutError] = useState('');
  const [progress, setProgress] = useState(0);
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createConsultancy>[0]) => createConsultancy(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultancyKeys.all });
    },
    onError: (err: Error) => {
      setMutError(err.message || 'Erro ao criar consultoria.');
      setStep(2);
    },
  });

  useEffect(() => {
    if (!open) {
      setStep(0);
      setForm(WIZARD_INITIAL);
      setTitleError('');
      setMutError('');
      setProgress(0);
    }
  }, [open]);

  // Animate progress bar on step 3
  useEffect(() => {
    if (step !== 3) return;
    setProgress(0);
    const start = Date.now();
    const duration = 2200;
    const raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          createMutation.mutate({
            title: form.title.trim(),
            ...(form.client_name.trim() ? { client_name: form.client_name.trim() } : {}),
            ...(form.niche.trim() ? { niche: form.niche.trim() } : {}),
            ...(form.instagram.trim() ? { instagram: form.instagram.trim() } : {}),
            ...(form.template ? { template: form.template } : {}),
            phase: 'onboarding',
          });
          onClose();
        }, 400);
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleNextStep1() {
    if (!form.title.trim()) {
      setTitleError('O título é obrigatório.');
      return;
    }
    setTitleError('');
    setStep(2);
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i < step
              ? 'h-2 w-2 bg-[var(--wizard-step-completed)]'
              : i === step
              ? 'h-2 w-5 bg-[var(--wizard-step-active)]'
              : 'h-2 w-2 bg-[var(--wizard-step-pending)]',
          )}
        />
      ))}
    </div>
  );

  return (
    <Modal open={open} onClose={step === 3 ? () => {} : onClose} persistent={step === 3} size="lg">
      {stepIndicator}

      <AnimatePresence mode="wait">
        {/* Step 0: Template */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Escolha o template</h2>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Qual é o foco desta consultoria?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(templateConfig) as [ConsultancyTemplate, typeof templateConfig[ConsultancyTemplate]][]).map(
                ([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setForm((f) => ({ ...f, template: key }))}
                    className={cn(
                      'rounded-[var(--radius-md)] p-4 text-left border transition-all duration-150',
                      form.template === key
                        ? 'border-[var(--consulting-iris)] bg-[var(--consulting-iris-subtle)] shadow-[0_0_0_1px_var(--consulting-iris)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface-2)] hover:border-[var(--border-default)]',
                    )}
                  >
                    <span className="text-[20px] leading-none block mb-2">{cfg.icon}</span>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{cfg.label}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{cfg.description}</p>
                  </button>
                ),
              )}
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setStep(1)}>
                Próximo →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Dados Básicos */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Dados Básicos</h2>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Identifique a consultoria e o cliente.</p>
            </div>
            <div className="space-y-3">
              <Input
                label="Título da consultoria"
                placeholder="Ex: Estratégia Q1 2026"
                value={form.title}
                onChange={(e) => {
                  setForm((f) => ({ ...f, title: e.target.value }));
                  if (titleError) setTitleError('');
                }}
                error={titleError}
                autoFocus
              />
              <Input
                label="Nome do cliente"
                placeholder="Ex: Maria Silva"
                value={form.client_name}
                onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
              />
              <Input
                label="Nicho"
                placeholder="Ex: Moda feminina, Saúde integrativa"
                value={form.niche}
                onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
              />
              <Input
                label="Instagram (opcional)"
                placeholder="@handle"
                value={form.instagram}
                onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>← Voltar</Button>
              <Button size="sm" onClick={handleNextStep1}>Próximo →</Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Contexto Estratégico */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Contexto Estratégico</h2>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Essas informações alimentam a IA Dedicada da cliente.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">
                  Qual o principal problema do cliente?
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o problema central que ele enfrenta…"
                  value={form.problem}
                  onChange={(e) => setForm((f) => ({ ...f, problem: e.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">
                  O que ele já tentou?
                </label>
                <textarea
                  rows={2}
                  placeholder="Soluções anteriores, o que funcionou, o que não funcionou…"
                  value={form.tried}
                  onChange={(e) => setForm((f) => ({ ...f, tried: e.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">
                  Qual o objetivo em 90 dias?
                </label>
                <textarea
                  rows={2}
                  placeholder="Resultado concreto esperado ao final da consultoria…"
                  value={form.goal90}
                  onChange={(e) => setForm((f) => ({ ...f, goal90: e.target.value }))}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>
            <AnimatePresence>
              {mutError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[12px] text-[var(--color-error)]"
                >
                  {mutError}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← Voltar</Button>
              <Button size="sm" onClick={() => setStep(3)}>Gerar com IA →</Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Gerando… */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            {/* Animated iris orb */}
            <div className="relative h-20 w-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="absolute inset-0 rounded-full opacity-60"
                style={{ background: 'conic-gradient(from 0deg, var(--consulting-iris), var(--consulting-ai-accent), var(--consulting-iris))' }}
              />
              <div className="absolute inset-2 rounded-full bg-[var(--bg-base)]" />
              <div className="absolute inset-3 rounded-full" style={{ background: 'var(--consulting-iris-subtle)' }} />
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">Preparando IA Dedicada</p>
              <p className="text-[13px] text-[var(--text-tertiary)] max-w-xs leading-relaxed">
                A Iris está analisando o contexto e preparando a IA Dedicada para {form.client_name || 'o cliente'}…
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{ background: 'var(--consulting-progress-track)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'var(--consulting-ai-gradient)',
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-md)] p-4 border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-[var(--radius-sm)] bg-[var(--bg-hover)] animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded bg-[var(--bg-hover)] animate-pulse" />
          <div className="h-3 w-24 rounded bg-[var(--bg-hover)] animate-pulse" />
        </div>
      </div>
      <div className="h-1 w-full rounded-full bg-[var(--bg-hover)] animate-pulse" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ConsultoriasPage() {
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const archiveMutation = useMutation({
    mutationFn: (id: string) => updateConsultancy(id, { status: 'archived' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consultancyKeys.all });
      setSelectedId(null);
    },
  });

  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: consultancyKeys.all,
    queryFn: fetchConsultancies,
    staleTime: 30_000,
  });

  const consultancies: Consultancy[] = data?.data ?? [];
  const stats: ConsultancyStats = data?.stats ?? { total: 0, active: 0, onboarding: 0, meetings_this_week: 0, at_risk: 0 };

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const filtered = consultancies
    .filter((c) => c.status === 'active')
    .filter((c) => phaseFilter === 'all' || c.phase === phaseFilter)
    .filter((c) => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        (c.client_name?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'alpha') return (a.client_name ?? a.title).localeCompare(b.client_name ?? b.title);
      if (sortBy === 'progress') return (b.implementation_score ?? 0) - (a.implementation_score ?? 0);
      if (sortBy === 'priority') {
        const wa = PRIORITY_WEIGHT[a.priority ?? 'low'] ?? 3;
        const wb = PRIORITY_WEIGHT[b.priority ?? 'low'] ?? 3;
        return wa - wb;
      }
      return 0;
    });

  const selected = consultancies.find((c) => c.id === selectedId) ?? null;

  const handleSelect = useCallback((c: Consultancy) => {
    setSelectedId((prev) => (prev === c.id ? null : c.id));
  }, []);

  const handleArchive = useCallback((id: string) => {
    archiveMutation.mutate(id);
  }, [archiveMutation]);

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-5"
      >
        {/* Header */}
        <motion.div variants={staggerItem} className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Consultorias</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {isLoading ? 'Carregando…' : `${stats.active} ativas`}
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + Nova Consultoria
          </Button>
        </motion.div>

        {/* KPI Row */}
        {!isLoading && (
          <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Ativas"
              value={stats.active}
              colorVar="--kpi-active"
              bgVar="--kpi-active-bg"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              }
            />
            <KpiCard
              label="Onboarding"
              value={stats.onboarding}
              colorVar="--kpi-onboarding"
              bgVar="--kpi-onboarding-bg"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              }
            />
            <KpiCard
              label="Reuniões (semana)"
              value={stats.meetings_this_week}
              colorVar="--kpi-meetings"
              bgVar="--kpi-meetings-bg"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              }
            />
            <KpiCard
              label="Em risco"
              value={stats.at_risk}
              colorVar="--kpi-risk"
              bgVar="--kpi-risk-bg"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              }
            />
          </motion.div>
        )}

        {/* Filter Bar */}
        <motion.div variants={staggerItem} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar cliente ou título…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-2)] pl-8 pr-3 py-1.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-3 py-1.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <option value="recent">Recentes</option>
              <option value="priority">Prioridade</option>
              <option value="progress">Progresso</option>
              <option value="alpha">A-Z</option>
            </select>
          </div>

          {/* Phase pills */}
          <div className="flex gap-1 flex-wrap">
            {phaseFilterLabels.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPhaseFilter(value)}
                className={cn(
                  'px-3 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors',
                  phaseFilter === value
                    ? 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

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
          {/* Card grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex items-center justify-center">
                  <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {debouncedSearch ? 'Nenhum resultado.' : 'Nenhuma consultoria ativa.'}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {debouncedSearch ? 'Tente outro termo.' : 'Crie uma nova para começar.'}
                  </p>
                </div>
                {!debouncedSearch && (
                  <Button size="sm" onClick={() => setShowCreate(true)}>
                    Criar Consultoria
                  </Button>
                )}
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
              >
                {filtered.map((c) => (
                  <ConsultancyCard
                    key={c.id}
                    consultancy={c}
                    selected={selectedId === c.id}
                    onSelect={handleSelect}
                    onArchive={handleArchive}
                  />
                ))}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <SmartSidebar selected={selected} />
          </div>
        </motion.div>
      </motion.div>

      <CreateConsultancyWizard open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
