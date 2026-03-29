import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Badge } from '../../../../components/ui/Badge.tsx';
import { type Oferta } from '../../../../api/courses.ts';

interface OfertaCardProps {
  oferta: Oferta;
  confirmDeleteId: string | null;
  isDeletePending: boolean;
  onEdit: (oferta: Oferta) => void;
  onManageTurmas: (oferta: Oferta) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onDelete: (id: string) => void;
}

export function OfertaCard({ oferta, confirmDeleteId, isDeletePending, onEdit, onManageTurmas,
  onConfirmDelete, onCancelDelete, onDelete }: OfertaCardProps) {
  const turmaCount = (oferta.oferta_turmas ?? []).length;
  return (
    <div className={cn('flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
      oferta.status === 'archived' && 'opacity-50')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">{oferta.name}</h3>
          <Badge variant={oferta.status === 'active' ? 'success' : 'locked'}>
            {oferta.status === 'active' ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {oferta.type === 'subscription' ? 'Assinatura' : 'Pagamento único'}
          {oferta.price_display ? ` · ${oferta.price_display}` : ''}
          {' · '}{turmaCount} turma{turmaCount !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => onManageTurmas(oferta)}>Turmas</Button>
        <button onClick={() => onEdit(oferta)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">Editar</button>
        {confirmDeleteId === oferta.id ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete(oferta.id)} disabled={isDeletePending} className="text-[10px] text-red-500 hover:text-red-400 transition-colors">Arquivar</button>
            <button onClick={onCancelDelete} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">Não</button>
          </div>
        ) : (
          <button onClick={() => onConfirmDelete(oferta.id)} className="text-xs text-[var(--text-tertiary)] hover:text-red-500 transition-colors">Arquivar</button>
        )}
      </div>
    </div>
  );
}
