import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const baseInputClasses = [
  'w-full rounded-[var(--radius-md)]',
  'bg-[var(--input-bg)]',
  'text-[16px] text-[var(--text-primary)]',
  'placeholder:text-[var(--text-muted)]',
  'ring-1 ring-inset ring-[var(--border-default)]',
  'transition-all duration-[var(--duration-fast)] ease-[var(--ease-out-expo)]',
  'focus:outline-none',
  'focus:ring-2 focus:ring-[var(--accent)]',
  'focus:bg-[var(--input-bg-focus)]',
  'hover:ring-[var(--border-strong)]',
  'disabled:opacity-40 disabled:cursor-not-allowed',
].join(' ');

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, icon, iconRight, className, id, ...props }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-[var(--text-secondary)] tracking-[0.01em]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] [&>svg]:w-4 [&>svg]:h-4 pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseInputClasses,
              'px-3.5 py-2.5',
              icon && 'pl-10',
              iconRight && 'pr-10',
              error && 'ring-2 ring-[var(--color-error)] focus:ring-[var(--color-error)] hover:ring-[var(--color-error)]',
              className,
            )}
            {...props}
          />

          {iconRight && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] [&>svg]:w-4 [&>svg]:h-4 pointer-events-none">
              {iconRight}
            </span>
          )}
        </div>

        {hint && !error && (
          <p className="text-[12px] text-[var(--text-tertiary)] leading-snug">{hint}</p>
        )}
        {error && (
          <p className="text-[12px] text-[var(--color-error)] leading-snug">{error}</p>
        )}
      </div>
    );
  },
);

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, className, id, ...props }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-[var(--text-secondary)] tracking-[0.01em]"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            baseInputClasses,
            'px-3.5 py-2.5',
            'resize-none',
            'min-h-[100px]',
            error && 'ring-2 ring-[var(--color-error)] focus:ring-[var(--color-error)] hover:ring-[var(--color-error)]',
            className,
          )}
          {...props}
        />

        {hint && !error && (
          <p className="text-[12px] text-[var(--text-tertiary)] leading-snug">{hint}</p>
        )}
        {error && (
          <p className="text-[12px] text-[var(--color-error)] leading-snug">{error}</p>
        )}
      </div>
    );
  },
);
