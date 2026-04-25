import { useEffect, useRef, useState } from 'react';
import { cn } from '../../../../lib/cn.ts';

const QUICK_EMOJIS = ['📄', '📖', '🧠', '💡', '🎯', '🚀', '🔧', '📊', '💬', '🦸', '🤝', '💰', '🌱', '⭐', '🔥', '✨'];

interface Props {
  title: string;
  emoji: string | null;
  isSaving: boolean;
  onTitleChange: (v: string) => void;
  onEmojiChange: (v: string) => void;
}

export function CentralPageHeader({ title, emoji, isSaving, onTitleChange, onEmojiChange }: Props) {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-3xl cursor-pointer',
              'hover:bg-[color-mix(in_srgb,white_5%,transparent)] transition-colors',
            )}
            title="Mudar ícone"
          >
            {emoji ?? '📄'}
          </button>
          {open && (
            <div
              ref={popRef}
              className="absolute z-30 top-full left-0 mt-2 consult-glass p-3 grid grid-cols-8 gap-1 w-[280px]"
            >
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { onEmojiChange(e); setOpen(false); }}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-xl hover:bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] cursor-pointer transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {isSaving && (
          <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Salvando…
          </span>
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Sem título"
        className="w-full bg-transparent border-none outline-none text-[36px] font-bold tracking-tight text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
      />
    </div>
  );
}
