import { motion } from 'framer-motion';
import { Button } from '../../../../../components/ui/Button.tsx';
import { Input } from '../../../../../components/ui/Input.tsx';
import type { WizardState, BasicDataErrors } from '../wizard.types.ts';

interface StepBasicDataProps {
  form: WizardState;
  onFormChange: (updater: (f: WizardState) => WizardState) => void;
  errors: BasicDataErrors;
  onClearError: (field: keyof BasicDataErrors) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitError?: string;
  loading?: boolean;
}

export function StepBasicData({ form, onFormChange, errors, onClearError, onCancel, onSubmit, submitError, loading }: StepBasicDataProps) {
  return (
    <motion.div key="step-basic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Nova consultoria</h2>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Identifique a cliente desta consultoria.</p>
      </div>
      <div className="space-y-3">
        <Input label="Nome da cliente" placeholder="Ex: Maria Silva" value={form.client_name}
          onChange={(e) => { onFormChange((f) => ({ ...f, client_name: e.target.value })); if (errors.client_name) onClearError('client_name'); }}
          error={errors.client_name} autoFocus />
        <Input label="Nicho" placeholder="Ex: Moda feminina, Saúde integrativa" value={form.niche}
          onChange={(e) => { onFormChange((f) => ({ ...f, niche: e.target.value })); if (errors.niche) onClearError('niche'); }}
          error={errors.niche} />
        <Input label="Instagram (opcional)" placeholder="@handle" value={form.instagram}
          onChange={(e) => onFormChange((f) => ({ ...f, instagram: e.target.value }))} />
        <Input label="Data de início" type="date" value={form.start_date}
          onChange={(e) => { onFormChange((f) => ({ ...f, start_date: e.target.value })); if (errors.start_date) onClearError('start_date'); }}
          error={errors.start_date} />
      </div>
      {submitError && (
        <p className="text-sm text-[var(--text-error,#ef4444)]">{submitError}</p>
      )}
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button size="sm" onClick={onSubmit} disabled={loading}>{loading ? 'Criando...' : 'Criar consultoria'}</Button>
      </div>
    </motion.div>
  );
}
