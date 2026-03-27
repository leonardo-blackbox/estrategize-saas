import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '../../../../components/ui/Button.tsx';
import { addAIMemory, consultancyKeys, type AIMemoryItem } from '../../services/consultorias.api.ts';

const CATEGORY_LABELS: Record<AIMemoryItem['category'], string> = {
  personal: 'Pessoal', business: 'Negócio', goals: 'Objetivos',
  obstacles: 'Obstáculos', context: 'Contexto', custom: 'Personalizado',
};

const CATEGORIES: AIMemoryItem['category'][] = ['personal', 'business', 'goals', 'obstacles', 'context', 'custom'];

interface MemoryAddFormProps {
  consultancyId: string;
  onClose: () => void;
}

export function MemoryAddForm({ consultancyId, onClose }: MemoryAddFormProps) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AIMemoryItem['category']>('context');

  const addMutation = useMutation({
    mutationFn: () => addAIMemory(consultancyId, { category, title, content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: consultancyKeys.aiMemory(consultancyId) }); onClose(); },
  });

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
      <div className="px-4 py-3 space-y-2 border-b border-[var(--border-hairline)] bg-[var(--bg-surface-2)]">
        <select value={category} onChange={(e) => setCategory(e.target.value as AIMemoryItem['category'])}
          className="w-full rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[12px] text-[var(--text-primary)] px-2.5 py-1.5 ring-1 ring-inset ring-[var(--border-default)] focus:outline-none focus:ring-[var(--consulting-iris,#7c5cfc)]">
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <input type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-2.5 py-1.5 ring-1 ring-inset ring-[var(--border-default)] focus:outline-none focus:ring-[var(--consulting-iris,#7c5cfc)]" />
        <textarea placeholder="Conteúdo…" value={content} onChange={(e) => setContent(e.target.value)} rows={2}
          className="w-full resize-none rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-2.5 py-1.5 ring-1 ring-inset ring-[var(--border-default)] focus:outline-none focus:ring-[var(--consulting-iris,#7c5cfc)]" />
        <div className="flex gap-2">
          <Button size="xs" onClick={() => addMutation.mutate()} disabled={!title.trim() || !content.trim()}
            loading={addMutation.isPending} style={{ background: 'var(--consulting-iris, #7c5cfc)' }}>Salvar</Button>
          <Button size="xs" variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </motion.div>
  );
}
