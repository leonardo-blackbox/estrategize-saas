import { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { Input } from '../../../../components/ui/Input.tsx';

interface GrantEntitlementModalProps {
  open: boolean;
  onClose: () => void;
  onGrant: (data: {
    course_id?: string;
    access: 'allow' | 'deny' | 'full_access';
    reason?: string;
    expires_at?: string | null;
  }) => void;
  isPending: boolean;
  courses: Array<{ id: string; title: string; status: string }>;
}

const defaultForm = { course_id: '', access: 'allow' as 'allow' | 'deny' | 'full_access', reason: '', expires_at: '' };

export function GrantEntitlementModal({ open, onClose, onGrant, isPending, courses }: GrantEntitlementModalProps) {
  const [form, setForm] = useState(defaultForm);

  function handleClose() {
    setForm(defaultForm);
    onClose();
  }

  function handleGrant() {
    onGrant({
      course_id: form.course_id || undefined,
      access: form.access,
      reason: form.reason || undefined,
      expires_at: form.expires_at || null,
    });
  }

  const selectClass = 'w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]';

  return (
    <Modal open={open} onClose={handleClose} className="sm:max-w-sm">
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Conceder Entitlement</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Curso</label>
            <select value={form.course_id} onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))} className={selectClass}>
              <option value="">Acesso global (todos os cursos)</option>
              {courses.filter((c) => c.status === 'published').map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Tipo de acesso</label>
            <select value={form.access} onChange={(e) => setForm((f) => ({ ...f, access: e.target.value as typeof form.access }))} className={selectClass}>
              <option value="allow">Permitido</option>
              <option value="full_access">Acesso Total (ignora drip)</option>
              <option value="deny">Bloqueado</option>
            </select>
          </div>
          <Input label="Motivo (opcional)" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Ex: Bonus, parceria..." />
          <Input label="Expira em (opcional)" type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} />
        </div>
        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={handleGrant} disabled={isPending}>{isPending ? 'Salvando...' : 'Conceder'}</Button>
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
