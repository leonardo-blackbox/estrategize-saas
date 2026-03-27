import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApplication, applicationKeys } from '../../../../api/applications.ts';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';

interface AplicacaoCreateModalProps { open: boolean; onClose: () => void; }

export function AplicacaoCreateModal({ open, onClose }: AplicacaoCreateModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => createApplication(title.trim()),
    onSuccess: (app) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      onClose(); setTitle('');
      navigate(`/aplicacoes/${app.id}/editor`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (title.trim().length > 0) mutate(); };
  const handleClose = () => { if (!isPending) { setTitle(''); onClose(); } };

  return (
    <Modal open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Nova aplicação</h2>
          <p className="text-[13px] text-[var(--text-secondary)]">Dê um nome para identificar seu formulário.</p>
        </div>
        <Input label="Nome da aplicação" placeholder="Ex: Formulário de Diagnóstico" value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 200))} maxLength={200} autoFocus disabled={isPending} />
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--text-tertiary)]">{title.length}/200</span>
          {error && <span className="text-[12px] text-red-400">{(error as Error).message ?? 'Erro ao criar'}</span>}
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={isPending}>Cancelar</Button>
          <Button type="submit" disabled={isPending || title.trim().length === 0}>
            {isPending ? 'Criando…' : 'Criar Aplicação'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
