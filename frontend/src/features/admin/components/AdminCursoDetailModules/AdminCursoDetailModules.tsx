import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';
import { cn } from '../../../../lib/cn.ts';
import { Button } from '../../../../components/ui/Button.tsx';
import { AdminCursoDetailLessons } from '../AdminCursoDetailLessons/index.ts';
import type { LessonLink } from '../../services/admin.api.ts';

interface AdminCursoDetailModulesProps {
  modules: any[];
  openModules: Set<string>;
  toggleModule: (id: string) => void;
  confirmDeleteModule: string | null;
  setConfirmDeleteModule: (id: string | null) => void;
  deleteModuleMutation: { mutate: (id: string) => void; isPending: boolean };
  onEditModule: (mod: any) => void;
  onCreateModule: () => void;
  // Lesson props
  confirmDeleteLesson: string | null;
  setConfirmDeleteLesson: (id: string | null) => void;
  deleteLessonMutation: { mutate: (id: string) => void; isPending: boolean };
  onEditLesson: (lesson: any) => void;
  onLinksLesson: (data: { id: string; title: string; links: LessonLink[] }) => void;
  onAddLesson: (moduleId: string) => void;
  onPublishLesson: (id: string) => void;
  onUnpublishLesson: (id: string) => void;
  isPublishLessonPending: boolean;
}

export function AdminCursoDetailModules({
  modules, openModules, toggleModule,
  confirmDeleteModule, setConfirmDeleteModule, deleteModuleMutation,
  onEditModule, onCreateModule,
  confirmDeleteLesson, setConfirmDeleteLesson, deleteLessonMutation,
  onEditLesson, onLinksLesson, onAddLesson,
  onPublishLesson, onUnpublishLesson, isPublishLessonPending,
}: AdminCursoDetailModulesProps) {
  return (
    <motion.div variants={staggerItem} className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Modulos ({modules.length})</h2>
        <Button size="sm" onClick={onCreateModule}>+ Modulo</Button>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
          <p className="text-xs text-[var(--text-tertiary)]">Nenhum modulo criado ainda.</p>
        </div>
      ) : (
        modules.map((mod: any, mi: number) => {
          const isOpen = openModules.has(mod.id);
          return (
            <div key={mod.id} className="rounded-[var(--radius-md)] bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => toggleModule(mod.id)} className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[11px] font-bold text-[var(--text-tertiary)]">{mi + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{mod.title}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">
                      {(mod.lessons ?? []).length} aulas
                      {mod.drip_days > 0 && ` · drip ${mod.drip_days}d`}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onEditModule(mod)} className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-2 py-1 transition-colors" title="Editar modulo">✏️</button>
                  {confirmDeleteModule === mod.id ? (
                    <>
                      <button onClick={() => deleteModuleMutation.mutate(mod.id)} disabled={deleteModuleMutation.isPending} className="text-[11px] text-red-500 px-2 py-1">Confirmar</button>
                      <button onClick={() => setConfirmDeleteModule(null)} className="text-[11px] text-[var(--text-tertiary)] px-2 py-1">Nao</button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDeleteModule(mod.id)} className="text-[11px] text-[var(--text-tertiary)] hover:text-red-500 px-2 py-1 transition-colors" title="Deletar modulo">🗑</button>
                  )}
                  <svg
                    onClick={() => toggleModule(mod.id)}
                    className={cn('h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 cursor-pointer', isOpen && 'rotate-180')}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {isOpen && (
                <AdminCursoDetailLessons
                  lessons={mod.lessons ?? []}
                  confirmDeleteLesson={confirmDeleteLesson}
                  deleteLessonMutation={deleteLessonMutation}
                  onEditLesson={onEditLesson}
                  onDeleteLesson={setConfirmDeleteLesson}
                  onCancelDeleteLesson={() => setConfirmDeleteLesson(null)}
                  onLinksLesson={onLinksLesson}
                  onAddLesson={() => onAddLesson(mod.id)}
                  onPublishLesson={onPublishLesson}
                  onUnpublishLesson={onUnpublishLesson}
                  isPublishLessonPending={isPublishLessonPending}
                />
              )}
            </div>
          );
        })
      )}
    </motion.div>
  );
}
