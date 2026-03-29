import { useState } from 'react';
import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { Modal } from '../../../../components/ui/Modal.tsx';

interface ManageSectionCoursesModalProps {
  section: any;
  allCourses: any[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (courseIds: string[]) => void;
}

export function ManageSectionCoursesModal({ section, allCourses, isSaving, onClose, onSave }: ManageSectionCoursesModalProps) {
  const currentCourseIds = (section.formation_section_courses ?? [])
    .map((sc: any) => sc.courses?.id).filter(Boolean) as string[];

  const [selected, setSelected] = useState<Set<string>>(new Set(currentCourseIds));

  const toggleCourse = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <Modal open onClose={onClose} className="sm:max-w-sm">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Cursos — {section.title}</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Selecione os cursos que aparecerão nesta seção.</p>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {allCourses.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">Nenhum curso encontrado.</p>
          ) : (
            allCourses.map((course: any) => (
              <button key={course.id} onClick={() => toggleCourse(course.id)}
                className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] border text-left transition-colors',
                  selected.has(course.id) ? 'bg-[var(--bg-hover)] border-[var(--border-default)]' : 'bg-[var(--bg-surface-1)] border-[var(--border-hairline)]')}>
                <div className={cn('h-4 w-4 rounded border flex items-center justify-center shrink-0',
                  selected.has(course.id) ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' : 'border-[var(--border-default)]')}>
                  {selected.has(course.id) && (
                    <svg className="h-3 w-3 text-[var(--bg-base)]" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-[var(--text-primary)] truncate">{course.title}</span>
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
