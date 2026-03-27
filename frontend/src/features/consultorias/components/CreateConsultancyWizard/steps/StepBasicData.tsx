import { motion } from 'framer-motion';
import { Button } from '../../../../../components/ui/Button.tsx';
import { Input } from '../../../../../components/ui/Input.tsx';
import type { WizardState } from '../wizard.types.ts';

interface StepBasicDataProps {
  form: WizardState;
  onFormChange: (updater: (f: WizardState) => WizardState) => void;
  titleError: string;
  onClearTitleError: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepBasicData({ form, onFormChange, titleError, onClearTitleError, onBack, onNext }: StepBasicDataProps) {
  return (
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Dados Básicos</h2>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Identifique a consultoria e o cliente.</p>
      </div>
      <div className="space-y-3">
        <Input label="Título da consultoria" placeholder="Ex: Estratégia Q1 2026" value={form.title}
          onChange={(e) => { onFormChange((f) => ({ ...f, title: e.target.value })); if (titleError) onClearTitleError(); }} error={titleError} autoFocus />
        <Input label="Nome do cliente" placeholder="Ex: Maria Silva" value={form.client_name}
          onChange={(e) => onFormChange((f) => ({ ...f, client_name: e.target.value }))} />
        <Input label="Nicho" placeholder="Ex: Moda feminina, Saúde integrativa" value={form.niche}
          onChange={(e) => onFormChange((f) => ({ ...f, niche: e.target.value }))} />
        <Input label="Instagram (opcional)" placeholder="@handle" value={form.instagram}
          onChange={(e) => onFormChange((f) => ({ ...f, instagram: e.target.value }))} />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>← Voltar</Button>
        <Button size="sm" onClick={onNext}>Próximo →</Button>
      </div>
    </motion.div>
  );
}
