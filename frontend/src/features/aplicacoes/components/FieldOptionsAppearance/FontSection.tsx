import { useEditorStore } from '../../../../stores/editorStore.ts';
import { cn } from '../../../../lib/cn.ts';
import { SectionLabel } from '../FieldOptionsShared/index.ts';

const FONT_OPTIONS = [
  'Inter', 'DM Sans', 'Poppins', 'Roboto', 'Montserrat',
  'Lato', 'Open Sans', 'Raleway', 'Nunito', 'Josefin Sans',
  'Playfair Display', 'Merriweather',
];

export function FontSection() {
  const { themeConfig, updateTheme } = useEditorStore();

  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>Tipografia</SectionLabel>
      <select
        value={themeConfig.fontFamily}
        onChange={(e) => updateTheme({ fontFamily: e.target.value })}
        className={cn(
          'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
          'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
          'outline-none focus:border-[var(--accent)] transition-colors cursor-pointer',
        )}
      >
        {FONT_OPTIONS.map((font) => (
          <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
        ))}
      </select>
    </div>
  );
}
