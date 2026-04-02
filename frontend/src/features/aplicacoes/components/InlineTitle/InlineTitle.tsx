import { useState, useEffect, useRef } from 'react';

interface InlineTitleProps {
  value: string;
  onSave: (v: string) => void;
}

export function InlineTitle({ value, onSave }: InlineTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus + select when entering edit mode
  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing]);

  function startEditing() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="bg-transparent outline-none border-b border-[var(--accent)] text-[var(--text-primary)] text-[14px] font-semibold min-w-[120px] max-w-[320px]"
        style={{ width: `${Math.max(draft.length, 8)}ch` }}
        maxLength={200}
      />
    );
  }

  return (
    <button
      onClick={startEditing}
      title="Clique para editar o nome"
      className="text-[var(--text-primary)] text-[14px] font-semibold hover:text-[var(--text-secondary)] transition-colors truncate max-w-[90px] sm:max-w-[180px] lg:max-w-[260px] text-left cursor-text"
    >
      {value || 'Sem titulo'}
    </button>
  );
}
