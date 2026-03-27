import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../components/ui/Button.tsx';
import { generateDeliverable, consultancyKeys, type DeliverableType } from '../../services/consultorias.api.ts';

const DELIVERABLE_TYPES: { type: DeliverableType; label: string; credits: number }[] = [
  { type: 'executive_summary',    label: 'Resumo Executivo',            credits: 2 },
  { type: 'strategic_diagnosis',  label: 'Diagnóstico Estratégico',     credits: 3 },
  { type: 'action_plan',          label: 'Plano de Ação',               credits: 4 },
  { type: 'positioning_doc',      label: 'Documento de Posicionamento', credits: 3 },
  { type: 'competition_analysis', label: 'Análise de Concorrência',     credits: 4 },
  { type: 'content_bank',         label: 'Banco de Conteúdo',           credits: 5 },
  { type: 'presentation',         label: 'Apresentação',                credits: 4 },
];

interface DeliverableDropdownProps {
  consultancyId: string;
}

export function DeliverableDropdown({ consultancyId }: DeliverableDropdownProps) {
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: (type: DeliverableType) => generateDeliverable(consultancyId, type),
    onSuccess: () => { qc.invalidateQueries({ queryKey: consultancyKeys.deliverables(consultancyId) }); setShow(false); },
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button variant="gradient" size="sm" onClick={() => setShow((v) => !v)}
        style={{ background: 'var(--consulting-ai-gradient, linear-gradient(135deg, #7c5cfc, #b04aff))' }}>
        ✦ Gerar Entregável ▾
      </Button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 z-50 min-w-[240px] rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-default)] shadow-[0_8px_24px_rgba(0,0,0,0.3)] overflow-hidden">
            {DELIVERABLE_TYPES.map((dt) => (
              <button key={dt.type} onClick={() => mutation.mutate(dt.type)} disabled={mutation.isPending}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-left">
                <span>{dt.label}</span><span className="text-[10px] text-[var(--text-muted)]">{dt.credits}cr</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
