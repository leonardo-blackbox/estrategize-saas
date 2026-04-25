import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { createConsultancy, consultancyKeys } from '../../services/consultorias.api.ts';
import { type WizardState, type BasicDataErrors, WIZARD_INITIAL } from './wizard.types.ts';
import { StepBasicData } from './steps/StepBasicData.tsx';

interface CreateConsultancyWizardProps {
  open: boolean;
  onClose: () => void;
}

export function CreateConsultancyWizard({ open, onClose }: CreateConsultancyWizardProps) {
  const [form, setForm] = useState<WizardState>(WIZARD_INITIAL);
  const [errors, setErrors] = useState<BasicDataErrors>({});
  const [submitError, setSubmitError] = useState('');
  const qc = useQueryClient();
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createConsultancy>[0]) => createConsultancy(payload),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: consultancyKeys.all });
      onClose();
      const id = response?.data?.id;
      if (id) navigate(`/consultorias/${id}`);
    },
    onError: (err: Error) => { setSubmitError(err.message || 'Erro ao criar consultoria.'); },
  });

  useEffect(() => {
    if (!open) { setForm(WIZARD_INITIAL); setErrors({}); setSubmitError(''); }
  }, [open]);

  function clearError(field: keyof BasicDataErrors) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSubmit() {
    const errs: BasicDataErrors = {};
    if (!form.client_name.trim()) errs.client_name = 'O nome da cliente é obrigatório.';
    if (!form.niche.trim()) errs.niche = 'O nicho é obrigatório.';
    if (!form.start_date) errs.start_date = 'A data de início é obrigatória.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitError('');
    const clientName = form.client_name.trim();
    createMutation.mutate({
      title: clientName,
      client_name: clientName,
      niche: form.niche.trim(),
      start_date: form.start_date,
      ...(form.instagram.trim() ? { instagram: form.instagram.trim() } : {}),
      phase: 'onboarding',
    });
  }

  const loading = createMutation.isPending;

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} persistent={loading} size="lg">
      <AnimatePresence mode="wait">
        <StepBasicData
          form={form}
          onFormChange={setForm}
          errors={errors}
          onClearError={clearError}
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitError={submitError}
          loading={loading}
        />
      </AnimatePresence>
    </Modal>
  );
}
