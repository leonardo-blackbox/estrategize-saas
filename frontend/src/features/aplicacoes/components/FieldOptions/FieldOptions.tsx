import { useEditorStore } from '../../../../stores/editorStore.ts';
import { FieldSettings } from './FieldSettings.tsx';
import { FieldOptionsAppearance } from '../FieldOptionsAppearance/index.ts';

export function FieldOptionsPanel() {
  const { fields, selectedFieldIndex } = useEditorStore();

  const selectedField =
    selectedFieldIndex !== null ? fields[selectedFieldIndex] ?? null : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '320px',
        height: '100%',
        background: 'var(--bg-surface-1)',
        borderLeft: '1px solid var(--border-hairline)',
        overflow: 'hidden',
      }}
    >
      <div
        className="shrink-0 flex items-center px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-hairline)' }}
      >
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          {selectedField ? 'Configuracoes' : 'Aparencia'}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedField !== null && selectedFieldIndex !== null ? (
          <FieldSettings field={selectedField} index={selectedFieldIndex} />
        ) : (
          <FieldOptionsAppearance />
        )}
      </div>
    </div>
  );
}
