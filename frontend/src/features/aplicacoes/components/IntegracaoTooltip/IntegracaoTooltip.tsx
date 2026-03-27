import { useState, useRef } from 'react';
import { cn } from '../../../../lib/cn.ts';

interface IntegracaoTooltipProps {
  text: string;
}

export function IntegracaoTooltip({ text }: IntegracaoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      aria-label={text}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-help"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7.25 7.25C7.25 6.836 7.586 6.5 8 6.5s.75.336.75.75v4.5a.75.75 0 0 1-1.5 0V7.25ZM8 5.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
          fill="currentColor"
        />
      </svg>
      {visible && (
        <span
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
            'w-56 px-3 py-2 rounded-lg text-[11px] leading-relaxed',
            'bg-[var(--bg-elevated,#1c1c1e)] text-[var(--text-primary)] shadow-lg',
            'border border-[var(--border-hairline)] pointer-events-none',
          )}
          style={{ whiteSpace: 'normal' }}
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: 'var(--border-hairline)' }}
          />
        </span>
      )}
    </span>
  );
}
