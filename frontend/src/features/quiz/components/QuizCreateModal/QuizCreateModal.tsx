import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { useCreateQuiz } from '../../hooks/useQuizzes.ts';

interface QuizCreateModalProps { open: boolean; onClose: () => void; }

export function QuizCreateModal({ open, onClose }: QuizCreateModalProps) {
  const [title, setTitle] = useState('');
  const createMutation = useCreateQuiz();
  const canSubmit = title.trim().length > 0 && title.length <= 200;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) createMutation.mutate(title.trim());
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo Quiz" size="sm">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.28em] text-cyan-200">Novo Quiz</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Dê um nome para o diagnóstico</h2>
        </div>
        <label className="block text-sm text-slate-200">
          Título
          <input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} autoFocus className="mt-2 min-h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-cyan-300" placeholder="Ex: Diagnóstico de Maturidade Comercial" />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 rounded-full px-5 text-sm text-slate-300 hover:bg-white/10">Cancelar</button>
          <button disabled={!canSubmit || createMutation.isPending} className="min-h-11 rounded-full bg-cyan-300 px-5 text-sm font-semibold text-slate-950 disabled:opacity-50">{createMutation.isPending ? 'Criando...' : 'Criar quiz'}</button>
        </div>
      </form>
    </Modal>
  );
}
