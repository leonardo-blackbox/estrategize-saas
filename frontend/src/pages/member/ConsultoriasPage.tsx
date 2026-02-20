import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';

interface Consultoria {
  id: string;
  name: string;
  company: string;
  status: 'active' | 'completed' | 'draft';
  lastActivity: string;
  hasDiagnosis: boolean;
}

const mockConsultorias: Consultoria[] = [
  { id: 'c1', name: 'Plano Estrategico 2026', company: 'Acme Corp', status: 'active', lastActivity: '2 horas atras', hasDiagnosis: true },
  { id: 'c2', name: 'Reestruturacao Comercial', company: 'Beta LTDA', status: 'active', lastActivity: '1 dia atras', hasDiagnosis: true },
  { id: 'c3', name: 'Expansao Regional', company: 'Gamma S.A.', status: 'draft', lastActivity: '3 dias atras', hasDiagnosis: false },
  { id: 'c4', name: 'Melhoria Operacional', company: 'Delta Inc', status: 'completed', lastActivity: '2 semanas atras', hasDiagnosis: true },
];

const statusConfig = {
  active: { label: 'Ativa', badgeVariant: 'success' as const },
  completed: { label: 'Concluida', badgeVariant: 'default' as const },
  draft: { label: 'Rascunho', badgeVariant: 'expiring' as const },
};

export function ConsultoriasPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const filtered = filter === 'all' ? mockConsultorias : mockConsultorias.filter((c) => c.status === filter);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Consultorias</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {mockConsultorias.length} consultorias
          </p>
        </div>
        <Button size="sm">
          Nova Consultoria
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={staggerItem} className="flex gap-1">
        {(['all', 'active', 'completed', 'draft'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
              filter === f
                ? 'bg-[var(--bg-surface-2)] text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
            )}
          >
            {f === 'all' ? 'Todas' : statusConfig[f].label}
          </button>
        ))}
      </motion.div>

      {/* List */}
      <motion.div variants={staggerItem} className="space-y-2">
        {filtered.map((c) => {
          const config = statusConfig[c.status];
          return (
            <motion.div key={c.id} variants={staggerItem}>
              <Link
                to={`/consultorias/${c.id}`}
                className={cn(
                  'flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4',
                  'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                  'hover:border-[var(--border-default)] hover:-translate-y-0.5',
                  'transition-all duration-200',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {c.name}
                    </h3>
                    <Badge variant={config.badgeVariant}>
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {c.company} &middot; {c.lastActivity}
                  </p>
                </div>
                <svg className="h-4 w-4 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
