import { Modal } from '../../../../components/ui/Modal.tsx';
import { Input } from '../../../../components/ui/Input.tsx';
import { Button } from '../../../../components/ui/Button.tsx';
import { CourseCoverUpload } from '../../../../components/admin/CourseCoverUpload.tsx';
import { CourseBannerUpload } from '../../../../components/admin/CourseBannerUpload.tsx';

interface CourseFormData {
  title: string;
  description: string;
  cover_url: string;
  banner_url: string;
}

interface CourseCreateModalProps {
  open: boolean;
  form: CourseFormData;
  pendingId: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: () => void;
  setForm: React.Dispatch<React.SetStateAction<CourseFormData>>;
}

export function CourseCreateModal({ open, form, pendingId, isPending, onClose, onSubmit, setForm }: CourseCreateModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="sm:max-w-md">
      <div className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Novo curso</h2>

        <div className="space-y-3">
          <Input
            label="Título *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Estratégia Empresarial Avançada"
          />
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descrição breve do curso..."
              rows={3}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]"
            />
          </div>
          <CourseCoverUpload
            courseId={pendingId}
            currentUrl={form.cover_url}
            onUploaded={(url) => setForm((f) => ({ ...f, cover_url: url }))}
          />
          <CourseBannerUpload
            courseId={pendingId}
            currentUrl={form.banner_url}
            onUploaded={(url) => setForm((f) => ({ ...f, banner_url: url }))}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onSubmit}
            disabled={!form.title.trim() || !form.cover_url || !form.banner_url || isPending}
            className="flex-1"
          >
            {isPending ? 'Criando...' : 'Criar curso'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
