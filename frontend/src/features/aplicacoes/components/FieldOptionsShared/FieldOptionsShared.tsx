import { useId, useRef, useEffect } from 'react';
import { cn } from '../../../../lib/cn.ts';

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
      {children}
    </span>
  );
}

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  label?: string;
}

export function Toggle({ checked, onChange, id, label }: ToggleProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label htmlFor={inputId} className="flex items-center gap-2.5 cursor-pointer group">
      {label && (
        <span className="text-[13px] text-[var(--text-primary)] select-none">{label}</span>
      )}
      <div className="relative ml-auto">
        <input
          id={inputId}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            'w-9 h-5 rounded-full transition-colors duration-200',
            checked ? 'bg-[var(--accent)]' : 'bg-[rgba(120,120,128,0.32)]',
          )}
        />
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm',
            'transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </div>
    </label>
  );
}

export interface AutoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onValueChange: (v: string) => void;
}

export function AutoTextarea({ value, onValueChange, ...rest }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      rows={2}
      className={cn(
        'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
        'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
        'outline-none focus:border-[var(--accent)] transition-colors',
        'resize-none overflow-hidden leading-relaxed',
      )}
      {...rest}
    />
  );
}
