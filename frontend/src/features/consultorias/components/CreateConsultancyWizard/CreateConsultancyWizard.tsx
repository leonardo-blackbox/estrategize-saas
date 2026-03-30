import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../lib/cn.ts';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { createConsultancy, consultancyKeys } from '../../services/consultorias.api.ts';
import { type WizardState, WIZARD_INITIAL } from './wizard.types.ts';
import { StepTemplate } from './steps/StepTemplate.tsx';
import { StepBasicData } from './steps/StepBasicData.tsx';
import { StepContext } from './steps/StepContext.tsx';
import { StepGenerating } from './steps/StepGenerating.tsx';

interface CreateConsultancyWizardProps {
  open: boolean;
  onClose: () => void;
}

export function CreateConsultancyWizard({ open, onClose }: CreateConsultancyWizardProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(WIZARD_INITIAL);
  const [titleError, setTitleError] = useState('');
  const [mutError, setMutError] = useState('');
  const [progress, setProgress] = useState(0);
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createConsultancy>[0]) => createConsultancy(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: consultancyKeys.all }); },
    onError: (err: Error) => { setMutError(err.message || 'Erro ao criar consultoria.'); setStep(2); },
  });

  useEffect(() => {
    if (!open) { setStep(0); setForm(WIZARD_INITIAL); setTitleError(''); setMutError(''); setProgress(0); }
  }, [open]);

  useEffect(() => {
    if (step !== 3) return;
    setProgress(0);
    const start = Date.now();
    const duration = 2200;
    const raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) { requestAnimationFrame(tick); }
      else {
        setTimeout(() => {
          createMutation.mutate({
            title: form.title.trim(),
            ...(form.client_name.trim() ? { client_name: form.client_name.trim() } : {}),
            ...(form.niche.trim() ? { niche: form.niche.trim() } : {}),
            ...(form.instagram.trim() ? { instagram: form.instagram.trim() } : {}),
            ...(form.template ? { template: form.template } : {}),
            ...(form.ticket ? { ticket: parseInt(form.ticket, 10) } : {}),
            ...(form.start_date ? { start_date: form.start_date } : {}),
            ...(form.goal90.trim() ? { strategic_summary: form.goal90.trim() } : {}),
            ...(form.problem.trim() ? { real_bottleneck: form.problem.trim() } : {}),
            ...(form.current_stage.trim() ? { current_stage: form.current_stage.trim() } : {}),
            has_team: form.has_team,
            has_website: form.has_website,
            phase: 'onboarding',
          });
          onClose();
        }, 400);
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function handleNextStep1() {
    if (!form.title.trim()) { setTitleError('O título é obrigatório.'); return; }
    setTitleError('');
    setStep(2);
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn('rounded-full transition-all duration-300',
          i < step ? 'h-2 w-2 bg-[var(--wizard-step-completed)]' : i === step ? 'h-2 w-5 bg-[var(--wizard-step-active)]' : 'h-2 w-2 bg-[var(--wizard-step-pending)]')} />
      ))}
    </div>
  );

  return (
    <Modal open={open} onClose={step === 3 ? () => {} : onClose} persistent={step === 3} size="lg">
      {stepIndicator}
      <AnimatePresence mode="wait">
        {step === 0 && <StepTemplate form={form} onFormChange={setForm} onNext={() => setStep(1)} />}
        {step === 1 && <StepBasicData form={form} onFormChange={setForm} titleError={titleError} onClearTitleError={() => setTitleError('')} onBack={() => setStep(0)} onNext={handleNextStep1} />}
        {step === 2 && <StepContext form={form} onFormChange={setForm} mutError={mutError} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <StepGenerating clientName={form.client_name} progress={progress} />}
      </AnimatePresence>
    </Modal>
  );
}
