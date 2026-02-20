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
  { id: 't1', name: 'Analise SWOT Inteligente', description: 'Gere uma analise SWOT completa com IA para seu negocio.', category: 'Estrategia', status: 'active' },
  { id: 't2', name: 'Canvas de Proposta de Valor', description: 'Mapeie sua proposta de valor vs. dores do cliente.', category: 'Produto', status: 'active' },
  { id: 't3', name: 'Calculadora de CAC/LTV', description: 'Calcule seus custos de aquisicao e lifetime value.', category: 'Financas', status: 'locked', requiredOffer: 'Plano Pro' },
  { id: 't4', name: 'OKR Builder', description: 'Defina objetivos e resultados-chave com framework estruturado.', category: 'Gestao', status: 'drip', dripDate: '2026-03-01' },
  { id: 't5', name: 'Mapa de Stakeholders', description: 'Identifique e priorize stakeholders do seu projeto.', category: 'Estrategia', status: 'expiring', expiryDate: '2026-02-25' },
  { id: 't6', name: 'Pricing Strategy', description: 'Modelo de precificacao baseado em valor percebido.', category: 'Financas', status: 'locked', requiredOffer: 'Plano Enterprise' },
];

function StatusBadge({ tool }: { tool: Tool }) {
  const isUrgent = tool.status === 'expiring' && isDaysUrgent(tool.expiryDate);

  if (tool.status === 'locked') {
    return (
      <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        Requer {tool.requiredOffer}
      </div>
    );
  }
  if (tool.status === 'drip') {
    return (
      <div className="text-[10px] text-[var(--text-secondary)]">
        Libera em {tool.dripDate}
      </div>
    );
  }
  if (tool.status === 'expiring') {
    return (
      <div className={cn(
        'text-[10px]',
        isUrgent ? 'text-[var(--color-warning)]' : 'text-[var(--text-tertiary)]',
      )}>
        Expira em {tool.expiryDate}
      </div>
    );
  }
  return null;
}

export function FerramentasPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Ferramentas</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Ferramentas estrategicas para acelerar suas decisoes de negocio.
        </p>
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <motion.button
            key={tool.id}
            variants={staggerItem}
            disabled={tool.status === 'locked' || tool.status === 'drip'}
            className={cn(
              'text-left rounded-[var(--radius-md)] p-4',
              'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
              'transition-all duration-200',
              tool.status === 'locked' || tool.status === 'drip'
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-[var(--border-default)] hover:-translate-y-0.5 active:scale-[0.98]',
            )}
          >
            <div className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              {tool.category}
            </div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
              {tool.name}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-3 line-clamp-2">
              {tool.description}
            </p>
            <StatusBadge tool={tool} />
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
