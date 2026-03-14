import { useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { isDaysUrgent } from '../../lib/dates.ts';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'locked' | 'drip' | 'expiring';
  requiredOffer?: string;
  dripDate?: string;
  expiryDate?: string;
}

const tools: Tool[] = [
  { id: 't1', name: 'Análise SWOT Inteligente', description: 'Gere uma análise SWOT completa com IA para seu negócio.', category: 'Estratégia', status: 'active' },
  { id: 't2', name: 'Canvas de Proposta de Valor', description: 'Mapeie sua proposta de valor vs. dores do cliente.', category: 'Produto', status: 'active' },
  { id: 't3', name: 'Calculadora de CAC/LTV', description: 'Calcule seus custos de aquisição e lifetime value.', category: 'Finanças', status: 'locked', requiredOffer: 'Plano Pro' },
  { id: 't4', name: 'OKR Builder', description: 'Defina objetivos e resultados-chave com framework estruturado.', category: 'Gestão', status: 'drip', dripDate: '2026-03-01' },
  { id: 't5', name: 'Mapa de Stakeholders', description: 'Identifique e priorize stakeholders do seu projeto.', category: 'Estratégia', status: 'expiring', expiryDate: '2026-02-25' },
  { id: 't6', name: 'Pricing Strategy', description: 'Modelo de precificação baseado em valor percebido.', category: 'Finanças', status: 'locked', requiredOffer: 'Plano Enterprise' },
];

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'Estratégia', label: 'Estratégia' },
  { key: 'Produto', label: 'Produto' },
  { key: 'Finanças', label: 'Finanças' },
  { key: 'Gestão', label: 'Gestão' },
];

function formatDripDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ tool }: { tool: Tool }) {
  const isUrgent = tool.status === 'expiring' && isDaysUrgent(tool.expiryDate);

  if (tool.status === 'drip') {
    return (
      <div className="text-[10px] text-[var(--text-secondary)]">
        Libera em {tool.dripDate ? formatDripDate(tool.dripDate) : '—'}
      </div>
    );
  }
  if (tool.status === 'expiring') {
    return (
      <div className={cn(
        'text-[10px]',
        isUrgent ? 'text-[var(--color-warning,#f59e0b)]' : 'text-[var(--text-tertiary)]',
      )}>
        Expira em {tool.expiryDate ? formatDripDate(tool.expiryDate) : '—'}
      </div>
    );
  }
  if (tool.status === 'active') {
    return (
      <div className="flex items-center gap-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        <span className="text-[10px] text-[var(--accent)]">Disponível</span>
      </div>
    );
  }
  return null;
}

function ToolCard({ tool }: { tool: Tool }) {
  const [hovered, setHovered] = useState(false);
  const isLocked = tool.status === 'locked';
  const isInactive = isLocked || tool.status === 'drip';
  const initial = tool.category.charAt(0).toUpperCase();

  return (
    <motion.button
      variants={staggerItem}
      disabled={isInactive}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative text-left rounded-[var(--radius-md)] p-4 overflow-hidden',
        'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
        'transition-all duration-200',
        isInactive
          ? 'cursor-not-allowed'
          : 'hover:border-[var(--border-default)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer',
        isLocked && 'opacity-70',
        tool.status === 'drip' && 'opacity-60',
      )}
    >
      {/* Icon area */}
      <div className={cn(
        'w-9 h-9 rounded-[var(--radius-sm)] mb-3 flex items-center justify-center shrink-0',
        'bg-[var(--bg-surface-2)] border border-[var(--border-hairline)]',
        'text-sm font-bold text-[var(--text-secondary)]',
      )}>
        {initial}
      </div>

      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1 leading-snug">
        {tool.name}
      </h3>
      <p className="text-xs text-[var(--text-tertiary)] mb-3 line-clamp-2 leading-relaxed">
        {tool.description}
      </p>
      <StatusBadge tool={tool} />

      {/* Locked overlay — appears on hover */}
      {isLocked && hovered && (
        <div className="absolute inset-0 bg-[var(--bg-base)]/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 rounded-[var(--radius-md)]">
          <svg
            className="h-5 w-5 text-[var(--text-secondary)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <span className="text-xs font-medium text-[var(--text-secondary)] text-center px-2">
            Requer {tool.requiredOffer}
          </span>
        </div>
      )}
    </motion.button>
  );
}

export function FerramentasPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Page header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Ferramentas</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Ferramentas estratégicas para acelerar suas decisões de negócio.
        </p>
      </motion.div>

      {/* Sections per category */}
      {CATEGORIES.map(({ key, label }) => {
        const categoryTools = tools.filter((t) => t.category === key);
        if (categoryTools.length === 0) return null;
        return (
          <motion.div key={key} variants={staggerItem} className="space-y-3">
            <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider px-1">
              {label}
            </h2>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {categoryTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
