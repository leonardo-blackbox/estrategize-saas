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
          <p className="text-xs font-semibold uppercase tracking-[.28em] text-[var(--accent)]">Novo Quiz</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Dê um nome para o diagnóstico</h2>
        </div>
        <label className="block text-sm text-[var(--text-primary)]">
          Título
          <input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} autoFocus className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-hover)] px-4 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Ex: Diagnóstico de Maturidade Comercial" />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 rounded-full px-5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancelar</button>
          <button disabled={!canSubmit || createMutation.isPending} className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-text)] disabled:opacity-50">{createMutation.isPending ? 'Criando...' : 'Criar quiz'}</button>
        </div>
      </form>
    </Modal>
  );
}
