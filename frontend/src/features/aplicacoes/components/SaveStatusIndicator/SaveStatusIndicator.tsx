import { AnimatePresence, motion } from 'framer-motion';
import { useEditorStore } from '../../../../stores/editorStore.ts';

export function SaveStatusIndicator() {
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const saveError = useEditorStore((s) => s.saveError);
  const forceSave = useEditorStore((s) => s.forceSave);

  return (
    <AnimatePresence mode="wait">
      {saveStatus === 'saving' && (
        <motion.span
          key="saving"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-[12px] text-[var(--text-tertiary)] flex items-center gap-1.5"
        >
          <span className="inline-block w-3 h-3 border-2 border-[var(--text-tertiary)] border-t-transparent rounded-full animate-spin" />
          Salvando...
        </motion.span>
      )}
      {saveStatus === 'saved' && (
        <motion.span
          key="saved"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-[12px] text-[#30d158] flex items-center gap-1"
        >
          Salvo
        </motion.span>
      )}
      {saveStatus === 'error' && (
        <motion.span
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-[12px] text-[#ff453a] flex items-center gap-1.5"
          title={saveError ?? undefined}
        >
          <button onClick={() => void forceSave()} className="underline hover:no-underline">
            Erro. Tentar novamente
          </button>
          {saveError && (
            <span className="opacity-70 max-w-[200px] truncate" title={saveError}>
              ({saveError})
            </span>
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
