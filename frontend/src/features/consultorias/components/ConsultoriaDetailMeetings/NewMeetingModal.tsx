import { useState, useEffect } from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

interface NewMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error?: string;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function NewMeetingModal({ open, onClose, onSubmit, isLoading, error }: NewMeetingModalProps) {
  const [url, setUrl] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl('');
      setLgpdConsent(false);
    }
  }, [open]);

  const urlError = url.length > 0 && !isValidUrl(url) ? 'URL inválida' : undefined;
  const canSubmit = url.length > 0 && isValidUrl(url) && lgpdConsent;

  function handleSubmit() {
    if (canSubmit) onSubmit(url);
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova Reunião" size="sm">
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Nova Reunião</h2>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            O bot Iris AI Notetaker entrará na reunião e transcrevará automaticamente.
          </p>
        </div>

        <Input
          label="Link da reunião"
          placeholder="https://meet.google.com/xxx-xxx-xxx"
          hint="Google Meet, Zoom ou Teams"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={urlError}
          type="url"
        />

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lgpdConsent}
            onChange={(e) => setLgpdConsent(e.target.checked)}
            className="mt-0.5 accent-[var(--accent)]"
          />
          <span className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Confirmo que todos os participantes foram informados sobre a gravação desta reunião, conforme exigido pela LGPD.
          </span>
        </label>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!canSubmit} loading={isLoading}>
            Ativar bot
          </Button>
        </div>
      </div>
    </Modal>
  );
}
