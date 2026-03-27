import { cn } from '../../../../lib/cn.ts';
import { SectionLabel } from './FieldOptionsShared.tsx';

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
        'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
        'outline-none focus:border-[var(--accent)] transition-colors',
      )}
    />
  );
}

export function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className={cn(
        'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
        'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
        'outline-none focus:border-[var(--accent)] transition-colors',
      )}
    />
  );
}

export function DateInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full bg-[var(--bg-surface-2)] border border-[var(--border-default)]',
          'rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)]',
          'outline-none focus:border-[var(--accent)] transition-colors',
        )}
      />
    </div>
  );
}
