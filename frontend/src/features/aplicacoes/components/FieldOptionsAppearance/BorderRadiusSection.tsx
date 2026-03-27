import { useEditorStore } from '../../../../stores/editorStore.ts';
import { SectionLabel } from '../FieldOptionsShared/index.ts';

export function BorderRadiusSection() {
  const { themeConfig, updateTheme } = useEditorStore();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <SectionLabel>Arredondamento</SectionLabel>
        <span className="text-[11px] font-mono text-[var(--text-tertiary)]">{themeConfig.borderRadius}px</span>
      </div>
      <input
        type="range" min={0} max={24} step={1}
        value={themeConfig.borderRadius}
        onChange={(e) => updateTheme({ borderRadius: Number(e.target.value) })}
        className="w-full accent-[var(--accent)] cursor-pointer"
      />
    </div>
  );
}
