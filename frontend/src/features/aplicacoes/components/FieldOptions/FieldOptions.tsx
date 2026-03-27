import { useState, useEffect } from 'react';
import { useEditorStore } from '../../../../stores/editorStore.ts';
import { cn } from '../../../../lib/cn.ts';
import { FieldSettings } from './FieldSettings.tsx';
import { FieldOptionsAppearance } from '../FieldOptionsAppearance/index.ts';

export function FieldOptionsPanel() {
  const { fields, selectedFieldIndex } = useEditorStore();
  const [showAppearance, setShowAppearance] = useState(false);

  const selectedField =
    selectedFieldIndex !== null ? fields[selectedFieldIndex] ?? null : null;

  // When user clicks a field, exit appearance mode to show field settings
  useEffect(() => {
    if (selectedFieldIndex !== null) setShowAppearance(false);
  }, [selectedFieldIndex]);

  const isAppearanceMode = showAppearance || selectedField === null;

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
        className="shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-hairline)' }}
      >
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">
          {isAppearanceMode ? 'Aparência' : 'Configurações'}
        </span>
        <button
          onClick={() => setShowAppearance((v) => !v)}
          title="Personalizar aparência"
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150',
            isAppearanceMode
              ? 'bg-[rgba(124,92,252,0.15)] text-[#7c5cfc]'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {isAppearanceMode ? (
          <FieldOptionsAppearance />
        ) : (
          <FieldSettings field={selectedField!} index={selectedFieldIndex!} />
        )}
      </div>
    </div>
  );
}
