import { cn } from '../../../../lib/cn.ts';
import { OptionsSection } from '../OptionsSection/index.ts';

interface OptionsGeneralSectionProps {
  title: string;
  onTitleChange: (v: string) => void;
}

export function OptionsGeneralSection({ title, onTitleChange }: OptionsGeneralSectionProps) {
  return (
    <OptionsSection title="Geral">
      <div>
        <label className="block text-[13px] text-[var(--text-secondary)] mb-1.5">
          Titulo do formulario <span className="text-[var(--text-tertiary)]">(max. 200 caracteres)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value.slice(0, 200))}
          maxLength={200}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-[14px]',
            'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
            'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
            'focus:outline-none focus:border-[var(--accent)] transition-colors',
          )}
        />
        <div className="text-right text-[11px] text-[var(--text-tertiary)] mt-1">{title.length}/200</div>
      </div>
    </OptionsSection>
  );
}
