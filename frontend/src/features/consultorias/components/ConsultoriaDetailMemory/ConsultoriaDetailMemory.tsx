import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/cn.ts';
import { Skeleton } from '../ConsultoriaDetailShared';
import { fetchAIMemory, deleteAIMemory, consultancyKeys, type AIMemoryItem } from '../../services/consultorias.api.ts';
import { MemoryAddForm } from './MemoryAddForm.tsx';

const CATEGORY_COLORS: Record<AIMemoryItem['category'], string> = {
  personal: 'bg-[rgba(255,159,10,0.10)] text-[var(--color-warning)]',
  business: 'bg-[rgba(52,199,89,0.08)] text-[var(--color-success)]',
  goals: 'bg-[rgba(124,92,252,0.10)] text-[var(--consulting-iris,#7c5cfc)]',
  obstacles: 'bg-[rgba(255,59,48,0.08)] text-[var(--color-error)]',
  context: 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
  custom: 'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]',
};

const CATEGORY_LABELS: Record<AIMemoryItem['category'], string> = {
  personal: 'Pessoal', business: 'Negócio', goals: 'Objetivos',
  obstacles: 'Obstáculos', context: 'Contexto', custom: 'Personalizado',
};

interface ConsultoriaDetailMemoryProps { consultancyId: string; }

export function ConsultoriaDetailMemory({ consultancyId }: ConsultoriaDetailMemoryProps) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: consultancyKeys.aiMemory(consultancyId),
    queryFn: () => fetchAIMemory(consultancyId),
  });

  const deleteMutation = useMutation({
    mutationFn: (memoryId: string) => deleteAIMemory(consultancyId, memoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultancyKeys.aiMemory(consultancyId) }),
  });

  const memory = data?.data ?? [];

  return (
    <div className="lg:w-80 shrink-0 rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-hairline)] flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-sm">🧠</span><span className="text-[13px] font-semibold text-[var(--text-primary)]">Memória da IA</span></div>
        <button onClick={() => setShowAdd((v) => !v)} className="text-xs text-[var(--consulting-iris,#7c5cfc)] hover:opacity-80 transition-opacity font-medium">+ Adicionar</button>
      </div>

      <AnimatePresence>
        {showAdd && <MemoryAddForm consultancyId={consultancyId} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : memory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-center">
            <span className="text-2xl opacity-40">🧠</span>
            <p className="text-[11px] text-[var(--text-muted)]">A IA aprende com cada interação</p>
          </div>
        ) : memory.map((item) => (
          <div key={item.id} className="rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-2)] border border-[var(--border-hairline)] group relative">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold', CATEGORY_COLORS[item.category])}>{CATEGORY_LABELS[item.category]}</span>
                <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">{item.content}</p>
              </div>
              <button onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--color-error)] text-xs leading-none" title="Remover">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
