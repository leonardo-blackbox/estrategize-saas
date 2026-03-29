import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { type Turma } from '../../../../api/courses.ts';

interface TurmaCardProps {
  turma: Turma;
  confirmDeleteId: string | null;
  isDeletePending: boolean;
  formatDate: (iso?: string | null) => string;
  onEdit: (turma: Turma) => void;
  onManageStudents: (turma: Turma) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onDelete: (id: string) => void;
}

export function TurmaCard({ turma, confirmDeleteId, isDeletePending, formatDate,
  onEdit, onManageStudents, onConfirmDelete, onCancelDelete, onDelete }: TurmaCardProps) {
  return (
    <div className={cn('flex items-center gap-4 px-4 py-3 rounded-[var(--radius-md)] border bg-[var(--bg-surface-1)] border-[var(--border-hairline)]',
      turma.status === 'archived' && 'opacity-50')}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{turma.name}</p>
          {turma.status === 'archived' && (
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)]">Arquivada</span>
          )}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {(turma as any).courses?.title ?? 'Curso'} &middot;{' '}
          {turma.drip_type === 'enrollment_date' ? 'Libera a partir da matrícula' : `Libera em ${formatDate(turma.access_start_date)}`}
          {' '}&middot; {turma.enrollment_count ?? 0} aluno{(turma.enrollment_count ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => onManageStudents(turma)}>Alunos</Button>
        <button onClick={() => onEdit(turma)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">Editar</button>
        {confirmDeleteId === turma.id ? (
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete(turma.id)} disabled={isDeletePending}
              className="text-[10px] text-red-500 hover:text-red-400 transition-colors">Confirmar</button>
            <button onClick={onCancelDelete} className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">Não</button>
          </div>
        ) : (
          <button onClick={() => onConfirmDelete(turma.id)} className="text-xs text-[var(--text-tertiary)] hover:text-red-500 transition-colors">Arquivar</button>
        )}
      </div>
    </div>
  );
}
