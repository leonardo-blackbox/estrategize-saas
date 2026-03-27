import { useRef } from 'react';
import { cn } from '../../../../lib/cn.ts';

export interface ColorPickerRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function ColorPickerRow({ label, value, onChange }: ColorPickerRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] text-[var(--text-primary)]">{label}</span>
      <button
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg',
          'border border-[var(--border-default)] hover:border-[var(--border-subtle)]',
          'bg-[var(--bg-surface-2)] transition-colors',
        )}
        title={value}
      >
        <span
          className="w-4 h-4 rounded-[4px] border border-[rgba(255,255,255,0.15)] shrink-0"
          style={{ background: value }}
        />
        <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
          {value}
        </span>
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </button>
    </div>
  );
}
