import { useEditorStore } from '../../../../stores/editorStore.ts';
import { SectionLabel, ColorPickerRow } from '../FieldOptionsShared/index.ts';

export function ColorsSection() {
  const { themeConfig, updateTheme } = useEditorStore();

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Cores</SectionLabel>
      <div className="flex flex-col gap-2.5">
        <ColorPickerRow label="Fundo" value={themeConfig.backgroundColor} onChange={(v) => updateTheme({ backgroundColor: v })} />
        <ColorPickerRow label="Perguntas" value={themeConfig.questionColor} onChange={(v) => updateTheme({ questionColor: v })} />
        <ColorPickerRow label="Respostas" value={themeConfig.answerColor} onChange={(v) => updateTheme({ answerColor: v })} />
        <ColorPickerRow label="Botao" value={themeConfig.buttonColor} onChange={(v) => updateTheme({ buttonColor: v })} />
        <ColorPickerRow label="Texto do botao" value={themeConfig.buttonTextColor} onChange={(v) => updateTheme({ buttonTextColor: v })} />
      </div>
    </div>
  );
}
