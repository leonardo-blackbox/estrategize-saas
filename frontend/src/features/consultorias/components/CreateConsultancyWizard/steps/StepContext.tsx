import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../../components/ui/Button.tsx';
import type { WizardState } from '../wizard.types.ts';

interface StepContextProps {
  form: WizardState;
  onFormChange: (updater: (f: WizardState) => WizardState) => void;
  mutError: string;
  onBack: () => void;
  onNext: () => void;
}

const textareaClass = 'w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors';

export function StepContext({ form, onFormChange, mutError, onBack, onNext }: StepContextProps) {
  return (
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Contexto Estratégico</h2>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Essas informações alimentam a IA Dedicada da cliente.</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">Dores relatadas</label>
          <textarea rows={3} placeholder="Descreva o problema central que ele enfrenta…" value={form.problem}
            onChange={(e) => onFormChange((f) => ({ ...f, problem: e.target.value }))} className={textareaClass} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">Objetivo principal</label>
          <textarea rows={2} placeholder="Resultado concreto esperado ao final da consultoria…" value={form.goal90}
            onChange={(e) => onFormChange((f) => ({ ...f, goal90: e.target.value }))} className={textareaClass} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">O que ele já tentou?</label>
          <textarea rows={2} placeholder="Soluções anteriores, o que funcionou, o que não funcionou…" value={form.tried}
            onChange={(e) => onFormChange((f) => ({ ...f, tried: e.target.value }))} className={textareaClass} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">Estágio atual do negócio</label>
          <textarea rows={2} placeholder="Ex: fatura R$10k/mês, time de 2 pessoas, sem processo definido…" value={form.current_stage}
            onChange={(e) => onFormChange((f) => ({ ...f, current_stage: e.target.value }))} className={textareaClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[var(--text-secondary)]">
            <input type="checkbox" checked={form.has_team}
              onChange={(e) => onFormChange((f) => ({ ...f, has_team: e.target.checked }))}
              className="rounded border-[var(--border-default)] accent-[var(--accent)]" />
            Tem equipe?
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[var(--text-secondary)]">
            <input type="checkbox" checked={form.has_website}
              onChange={(e) => onFormChange((f) => ({ ...f, has_website: e.target.checked }))}
              className="rounded border-[var(--border-default)] accent-[var(--accent)]" />
            Tem site ou loja online?
          </label>
        </div>
      </div>
      <AnimatePresence>
        {mutError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[12px] text-[var(--color-error)]">{mutError}</motion.p>}
      </AnimatePresence>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>← Voltar</Button>
        <Button size="sm" onClick={onNext}>Gerar com IA →</Button>
      </div>
    </motion.div>
  );
}
