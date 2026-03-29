import { useState } from 'react';
import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Modal } from '../../../../components/ui/Modal.tsx';
import { type Oferta, type Turma } from '../../../../api/courses.ts';

interface Props {
  oferta: Oferta;
  activeTurmas: Turma[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (turmaIds: string[]) => void;
}

export function ManageOfertaTurmasModal({ oferta, activeTurmas, isSaving, onClose, onSave }: Props) {
  const currentIds = new Set((oferta.oferta_turmas ?? []).map((ot) => ot.turmas?.id).filter(Boolean) as string[]);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds));

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <Modal open onClose={onClose} className="sm:max-w-sm">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Turmas — {oferta.name}</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Selecione as turmas que o comprador terá acesso ao adquirir esta oferta.</p>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {activeTurmas.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">Nenhuma turma ativa. Crie turmas primeiro.</p>
          ) : (
            activeTurmas.map((turma) => (
              <button key={turma.id} onClick={() => toggle(turma.id)}
                className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] border text-left transition-colors',
                  selected.has(turma.id) ? 'bg-[var(--bg-hover)] border-[var(--border-default)]' : 'bg-[var(--bg-surface-1)] border-[var(--border-hairline)]')}>
                <div className={cn('h-4 w-4 rounded border flex items-center justify-center shrink-0',
                  selected.has(turma.id) ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' : 'border-[var(--border-default)]')}>
                  {selected.has(turma.id) && (
                    <svg className="h-3 w-3 text-[var(--bg-base)]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{turma.name}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">{(turma as any).courses?.title ?? 'Curso'}</p>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={() => onSave(Array.from(selected))} disabled={isSaving}>
            {isSaving ? 'Salvando...' : `Salvar (${selected.size})`}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  );
}
