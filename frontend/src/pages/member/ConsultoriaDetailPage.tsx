import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Badge } from '../../components/ui/Badge.tsx';

type Tab = 'overview' | 'diagnosis' | 'notes' | 'timeline';

const tabItems: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Visao Geral' },
  { value: 'diagnosis', label: 'Diagnostico IA' },
  { value: 'notes', label: 'Notas & Arquivos' },
  { value: 'timeline', label: 'Historico' },
];

const mockTimeline = [
  { id: '1', type: 'create', text: 'Consultoria criada', date: '2026-02-15 10:30' },
  { id: '2', type: 'diagnosis', text: 'Diagnostico IA gerado', date: '2026-02-15 10:31' },
  { id: '3', type: 'edit', text: 'Diagnostico editado pelo consultor', date: '2026-02-16 14:00' },
  { id: '4', type: 'note', text: 'Nota adicionada: "Revisar posicionamento"', date: '2026-02-18 09:15' },
];

export function ConsultoriaDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

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
        <span className="text-[var(--text-secondary)]">Plano Estrategico 2026</span>
      </motion.div>

      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Plano Estrategico 2026
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          Acme Corp &middot; Consultoria #{id}
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={staggerItem} className="flex gap-1 border-b border-[var(--border-hairline)] overflow-x-auto scrollbar-none">
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
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Resumo</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Consultoria estrategica para definicao do plano de crescimento 2026 da Acme Corp,
                focando em expansao de mercado, otimizacao operacional e desenvolvimento de
                novos canais de receita.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Status', value: 'Ativa' },
                { label: 'Criada em', value: '15/02/2026' },
                { label: 'Ultima atividade', value: '2 horas atras' },
              ].map((item) => (
                <div key={item.label} className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]">
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'diagnosis' && (
          <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Diagnostico IA (Metodo Iris)</h3>
              <Badge variant="success">Gerado</Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              A Acme Corp apresenta um posicionamento solido no mercado B2B, com oportunidades
              significativas de expansao em tres verticais adjacentes. Os principais desafios
              identificados sao: (1) fragmentacao do processo comercial, (2) dependencia de
              canais tradicionais, e (3) necessidade de profissionalizacao da gestao de pessoas.
            </p>
            <div className="text-xs text-[var(--text-tertiary)]">
              Gerado em 15/02/2026 &middot; 1 credito utilizado
            </div>
          </div>
        )}

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

        {activeTab === 'timeline' && (
          <div className="space-y-0">
            {mockTimeline.map((event, i) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-[var(--text-primary)] mt-1.5" />
                  {i < mockTimeline.length - 1 && (
                    <div className="w-px flex-1 bg-[var(--border-hairline)]" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm text-[var(--text-primary)]">{event.text}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
