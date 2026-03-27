import { motion } from 'framer-motion';
import { cn } from '../../../../../lib/cn.ts';
import { Button } from '../../../../../components/ui/Button.tsx';
import { templateConfig, type ConsultancyTemplate } from '../../../services/consultorias.api.ts';
import type { WizardState } from '../wizard.types.ts';

interface StepTemplateProps {
  form: WizardState;
  onFormChange: (updater: (f: WizardState) => WizardState) => void;
  onNext: () => void;
}

export function StepTemplate({ form, onFormChange, onNext }: StepTemplateProps) {
  return (
    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Escolha o template</h2>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Qual é o foco desta consultoria?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(templateConfig) as [ConsultancyTemplate, typeof templateConfig[ConsultancyTemplate]][]).map(
          ([key, cfg]) => (
            <button key={key} onClick={() => onFormChange((f) => ({ ...f, template: key }))}
              className={cn('rounded-[var(--radius-md)] p-4 text-left border transition-all duration-150',
                form.template === key ? 'border-[var(--consulting-iris)] bg-[var(--consulting-iris-subtle)] shadow-[0_0_0_1px_var(--consulting-iris)]' : 'border-[var(--border-hairline)] bg-[var(--bg-surface-2)] hover:border-[var(--border-default)]')}>
              <span className="text-[20px] leading-none block mb-2">{cfg.icon}</span>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">{cfg.label}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{cfg.description}</p>
            </button>
          ),
        )}
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={onNext}>Próximo →</Button>
      </div>
    </motion.div>
  );
}
