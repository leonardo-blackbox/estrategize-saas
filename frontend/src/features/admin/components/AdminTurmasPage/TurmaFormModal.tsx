import { useState } from 'react';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { type Turma } from '../../../../api/courses.ts';

export interface TurmaFormData {
  course_id: string;
  name: string;
  description: string;
  drip_type: 'enrollment_date' | 'fixed_date';
  access_start_date: string;
}

interface TurmaFormModalProps {
  turma?: Turma;
  courses: any[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: TurmaFormData) => void;
}

export function TurmaFormModal({ turma, courses, isSaving, onClose, onSubmit }: TurmaFormModalProps) {
  const [form, setForm] = useState<TurmaFormData>({
    course_id: turma?.course_id ?? '',
    name: turma?.name ?? '',
    description: turma?.description ?? '',
    drip_type: (turma?.drip_type ?? 'enrollment_date') as 'enrollment_date' | 'fixed_date',
    access_start_date: turma?.access_start_date ? turma.access_start_date.slice(0, 10) : '',
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!form.course_id || !form.name.trim()) { setError('Curso e nome são obrigatórios.'); return; }
    onSubmit(form);
  };

  return (
    <Modal open onClose={onClose} className="sm:max-w-sm">
      <div className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{turma ? 'Editar turma' : 'Nova turma'}</h2>
        {!turma && (
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Curso</label>
            <select value={form.course_id} onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
              className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]">
              <option value="">Selecionar curso...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}
        <Input label="Nome da turma" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Turma Janeiro 2025" />
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Regra de liberação</label>
          <select value={form.drip_type} onChange={(e) => setForm((f) => ({ ...f, drip_type: e.target.value as 'enrollment_date' | 'fixed_date' }))}
            className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]">
            <option value="enrollment_date">A partir da data de matrícula</option>
            <option value="fixed_date">A partir de uma data fixa</option>
          </select>
        </div>
        {form.drip_type === 'fixed_date' && (
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Data de início</label>
            <input type="date" value={form.access_start_date} onChange={(e) => setForm((f) => ({ ...f, access_start_date: e.target.value }))}
              className="w-full text-xs rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]" />
          </div>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Salvando...' : (turma ? 'Salvar' : 'Criar turma')}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
