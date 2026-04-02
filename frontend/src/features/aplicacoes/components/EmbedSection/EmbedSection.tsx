import { useState } from 'react';
import { cn } from '../../../../lib/cn.ts';

type EmbedType = 'normal' | 'popup' | 'slider';
type WidthUnit = '%' | 'px';

const EMBED_LABELS: Record<EmbedType, string> = {
  normal: 'Normal',
  popup: 'Popup',
  slider: 'Slider',
};

function generateEmbedCode(
  slug: string,
  type: EmbedType,
  width: number,
  widthUnit: WidthUnit,
  height: number,
): string {
  const url = `${window.location.origin}/f/${slug}`;
  if (type === 'normal') {
    return `<iframe\n  src="${url}"\n  width="${width}${widthUnit}"\n  height="${height}px"\n  frameborder="0"\n  allow="clipboard-write"\n  style="border:none;border-radius:8px;"\n></iframe>`;
  }
  return `<!-- Embed tipo "${type}" -- em breve -->\n<a href="${url}" target="_blank">Abrir formulario</a>`;
}

interface EmbedSectionProps {
  slug: string;
  embedHeight: number;
  onEmbedHeightChange: (h: number) => void;
}

export function EmbedSection({ slug, embedHeight, onEmbedHeightChange }: EmbedSectionProps) {
  const [embedType, setEmbedType] = useState<EmbedType>('normal');
  const [embedWidth, setEmbedWidth] = useState(100);
  const [embedWidthUnit, setEmbedWidthUnit] = useState<WidthUnit>('%');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  function handleGenerateCode() {
    const code = generateEmbedCode(slug, embedType, embedWidth, embedWidthUnit, embedHeight);
    setGeneratedCode(code);
    setCodeCopied(false);
  }

  function handleCopyCode() {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }).catch(() => null);
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Codigo de incorporacao</h3>
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]')}>i</span>
      </div>
      <p className="text-[12px] text-[var(--text-secondary)] mb-4">Adicionar o formulario no seu site</p>

      <div className="mb-4">
        <select
          value={embedType}
          onChange={(e) => setEmbedType(e.target.value as EmbedType)}
          className={cn('w-full px-3 py-2 rounded-lg text-[13px]', 'bg-[var(--bg-base)] border border-[var(--border-hairline)]', 'text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]', 'transition-colors duration-150')}
        >
          {(Object.keys(EMBED_LABELS) as EmbedType[]).map((t) => (
            <option key={t} value={t}>{EMBED_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <label className="text-[13px] text-[var(--text-secondary)] w-16 flex-shrink-0">Largura</label>
        <input type="number" value={embedWidth} onChange={(e) => setEmbedWidth(Number(e.target.value))} min={1} max={9999} className={cn('flex-1 px-3 py-2 rounded-lg text-[13px]', 'bg-[var(--bg-base)] border border-[var(--border-hairline)]', 'text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors')} />
        <select value={embedWidthUnit} onChange={(e) => setEmbedWidthUnit(e.target.value as WidthUnit)} className={cn('w-16 px-2 py-2 rounded-lg text-[13px]', 'bg-[var(--bg-base)] border border-[var(--border-hairline)]', 'text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors')}>
          <option value="%">%</option>
          <option value="px">px</option>
        </select>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <label className="text-[13px] text-[var(--text-secondary)] w-16 flex-shrink-0">Altura</label>
        <input type="number" value={embedHeight} onChange={(e) => onEmbedHeightChange(Number(e.target.value))} min={100} max={9999} className={cn('flex-1 px-3 py-2 rounded-lg text-[13px]', 'bg-[var(--bg-base)] border border-[var(--border-hairline)]', 'text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors')} />
        <span className="w-16 text-[13px] text-center text-[var(--text-secondary)]">px</span>
      </div>

      <button onClick={handleGenerateCode} className={cn('w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer', 'bg-[var(--accent)] text-white hover:opacity-90', 'transition-all duration-150 active:scale-[0.98]', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-surface-1)]', 'shadow-[0_1px_3px_rgba(0,0,0,0.2)]')}>
        Gerar codigo
      </button>

      {generatedCode && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[var(--text-tertiary)]">Codigo gerado</span>
            <button onClick={handleCopyCode} className="text-[12px] font-medium text-[var(--accent)] hover:underline cursor-pointer focus-visible:outline-none">
              {codeCopied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <pre className={cn('p-3 rounded-lg text-[11px] font-mono overflow-x-auto', 'bg-[var(--bg-base)] border border-[var(--border-hairline)]', 'text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-all')}>
            {generatedCode}
          </pre>
        </div>
      )}
    </section>
  );
}
