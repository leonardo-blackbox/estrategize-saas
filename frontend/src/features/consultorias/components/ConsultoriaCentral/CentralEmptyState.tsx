import { motion } from 'framer-motion';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { centralApi, type CentralTemplateInfo } from '../../services/central.api.ts';
import { centralKeys, useCentralPages } from '../../hooks/useCentralPages.ts';
import { useCentralMutations } from '../../hooks/useCentralMutations.ts';

interface Props {
  consultancyId: string;
  onPageCreated: (pageId: string) => void;
}

export function CentralEmptyState({ consultancyId, onPageCreated }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const { create, applyTemplate } = useCentralMutations(consultancyId);
  const { pages } = useCentralPages(consultancyId);

  const { data: templates = [] } = useQuery({
    queryKey: centralKeys.templates(consultancyId),
    queryFn: () => centralApi.templates(consultancyId),
    staleTime: Infinity,
  });

  const handleBlank = async () => {
    setBusy('blank');
    try {
      const page = await create.mutateAsync({ title: 'Sem título', emoji: '📄' });
      onPageCreated(page.id);
    } finally { setBusy(null); }
  };

  const handleTemplate = async (t: CentralTemplateInfo) => {
    setBusy(t.key);
    try {
      const created = await applyTemplate.mutateAsync(t.key);
      if (created.length > 0) onPageCreated(created[0].id);
    } finally { setBusy(null); }
  };

  if (pages.length > 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="consult-glass p-8 max-w-3xl mx-auto"
    >
      <div className="text-center space-y-2 mb-7">
        <div className="text-5xl mb-3">🧠</div>
        <h2 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">
          A Central está pronta
        </h2>
        <p className="text-[13px] text-[var(--text-tertiary)] max-w-md mx-auto leading-relaxed">
          Comece com um template da metodologia da Iris ou crie sua primeira página em branco.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {templates.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTemplate(t)}
            disabled={busy !== null}
            className="consult-glass consult-glass-hover p-4 text-left cursor-pointer disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">{t.name}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">{t.description}</p>
            <p className="text-[10px] text-[var(--accent)] mt-2 font-medium">
              {busy === t.key ? 'Aplicando…' : `${t.pageCount} ${t.pageCount === 1 ? 'página' : 'páginas'}`}
            </p>
          </button>
        ))}
      </div>

      <button
        onClick={handleBlank}
        disabled={busy !== null}
        className="mt-5 w-full text-center text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] py-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        {busy === 'blank' ? 'Criando…' : '+ ou comece com uma página em branco'}
      </button>
    </motion.div>
  );
}
