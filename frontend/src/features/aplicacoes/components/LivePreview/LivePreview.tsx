import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '../../../../stores/editorStore.ts';
import { LivePreviewDeviceToggle } from '../LivePreviewDeviceToggle/index.ts';
import { LivePreviewNavToolbar } from '../LivePreviewNavToolbar/index.ts';
import { renderFieldPreview } from './render-field-preview.tsx';

export function LivePreviewPanel() {
  const { fields, selectedFieldIndex, selectField, themeConfig, previewDevice, setPreviewDevice } =
    useEditorStore();

  const currentField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : fields[0];
  const currentIndex = selectedFieldIndex !== null ? selectedFieldIndex : 0;
  const totalFields = fields.length;
  const isDesktop = previewDevice === 'desktop';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#1c1c1e',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span className="text-[12px] font-medium text-[rgba(255,255,255,0.4)] uppercase tracking-wider">
          Pre-visualizacao
        </span>
        {totalFields > 0 && (
          <span className="text-[12px] text-[rgba(255,255,255,0.4)]">
            Campo {currentIndex + 1} de {totalFields}
          </span>
        )}
        <LivePreviewDeviceToggle device={previewDevice} onChange={setPreviewDevice} />
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center gap-3 opacity-30">
            <span className="text-[40px]">&#128203;</span>
            <p className="text-[13px] text-white">Adicione campos para visualizar</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${previewDevice}-${currentIndex}`}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: isDesktop ? '90%' : '375px',
                maxWidth: isDesktop ? '720px' : '375px',
                height: isDesktop ? '90%' : '667px',
                maxHeight: isDesktop ? 'calc(100% - 40px)' : '667px',
                borderRadius: isDesktop ? 16 : 44,
                background: themeConfig.backgroundColor,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {currentField && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    boxShadow: 'inset 0 0 0 2px rgba(124,92,252,0.4)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )}

              {themeConfig.logoUrl &&
                currentField?.type !== 'welcome' &&
                currentField?.type !== 'thank_you' && (
                  <div style={{ position: 'absolute', top: 16, left: 20, zIndex: 5, pointerEvents: 'none' }}>
                    <img src={themeConfig.logoUrl} alt="Logo" style={{ height: 24, objectFit: 'contain', maxWidth: 100 }} />
                  </div>
                )}

              <div style={{ height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
                {currentField
                  ? renderFieldPreview(currentField, themeConfig)
                  : (
                    <div className="flex items-center justify-center h-full opacity-30">
                      <span className="text-[13px] text-white">Nenhum campo selecionado</span>
                    </div>
                  )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        <LivePreviewNavToolbar
          currentIndex={currentIndex}
          totalFields={totalFields}
          onNavigate={selectField}
        />
      </div>
    </div>
  );
}
