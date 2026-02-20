import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, id, ...props }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-[var(--radius-md)] px-3.5 py-2.5',
            'bg-[var(--bg-surface-1)]',
            'text-[16px] text-[var(--text-primary)]', /* 16px prevents iOS Safari zoom */
            'placeholder:text-[var(--text-muted)]',
            'ring-1 ring-inset ring-[var(--border-default)]',
            'focus:ring-2 focus:ring-[var(--text-primary)]',
            'focus:outline-none',
            'transition-shadow duration-[var(--duration-fast)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'ring-[var(--color-error)] focus:ring-[var(--color-error)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-[12px] text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  },
);

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className, id, ...props }, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-[var(--radius-md)] px-3.5 py-2.5',
            'bg-[var(--bg-surface-1)]',
            'text-[16px] text-[var(--text-primary)]',
            'placeholder:text-[var(--text-muted)]',
            'ring-1 ring-inset ring-[var(--border-default)]',
            'focus:ring-2 focus:ring-[var(--text-primary)]',
            'focus:outline-none',
            'transition-shadow duration-[var(--duration-fast)]',
            'resize-none',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'ring-[var(--color-error)] focus:ring-[var(--color-error)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-[12px] text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  },
);
