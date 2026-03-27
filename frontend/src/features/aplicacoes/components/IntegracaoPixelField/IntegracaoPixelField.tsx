import { cn } from '../../../../lib/cn.ts';
import { IntegracaoTooltip } from '../IntegracaoTooltip';

interface IntegracaoPixelFieldProps {
  label: string;
  placeholder: string;
  value: string;
  active: boolean;
  onValueChange: (v: string) => void;
  onActiveChange: (v: boolean) => void;
  tooltip?: string;
}

export function IntegracaoPixelField({
  label,
  placeholder,
  value,
  active,
  onValueChange,
  onActiveChange,
  tooltip,
}: IntegracaoPixelFieldProps) {
  return (
    <div
      className="p-4 rounded-xl mb-3"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</span>
          {tooltip && <IntegracaoTooltip text={tooltip} />}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={() => onActiveChange(!active)}
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            active ? 'bg-[var(--accent)]' : 'bg-[var(--border-hairline)]',
          )}
        >
          <span
            className={cn(
              'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
              active ? 'translate-x-[18px]' : 'translate-x-1',
            )}
          />
        </button>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full px-3 py-2 rounded-lg text-[13px] font-mono',
          'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
          'text-[var(--text-primary)] placeholder-[var(--text-tertiary)]',
          'focus:outline-none focus:border-[var(--accent)] transition-colors',
        )}
      />
    </div>
  );
}
