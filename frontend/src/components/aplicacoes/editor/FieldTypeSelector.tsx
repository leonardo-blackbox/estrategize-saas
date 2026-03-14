import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { type FieldType } from '../../../api/applications.ts';
import { cn } from '../../../lib/cn.ts';

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

const FIELD_TYPE_META: Record<FieldType, { label: string; icon: string; category: 'basic' | 'choice' | 'structure' }> = {
  welcome:         { label: 'Boas-vindas',   icon: '👋', category: 'structure' },
  message:         { label: 'Mensagem',       icon: '💬', category: 'structure' },
  short_text:      { label: 'Texto Curto',    icon: 'Aa', category: 'basic' },
  long_text:       { label: 'Texto Longo',    icon: '☰',  category: 'basic' },
  name:            { label: 'Nome',           icon: '👤', category: 'basic' },
  email:           { label: 'E-mail',         icon: '@',  category: 'basic' },
  phone:           { label: 'Telefone',       icon: '📞', category: 'basic' },
  multiple_choice: { label: 'Múltipla',       icon: '◉',  category: 'choice' },
  number:          { label: 'Número',         icon: '#',  category: 'basic' },
  date:            { label: 'Data',           icon: '📅', category: 'basic' },
  thank_you:       { label: 'Agradecimento',  icon: '✓',  category: 'structure' },
};

const SECTIONS: { title: string; types: FieldType[] }[] = [
  {
    title: 'Básicos',
    types: ['short_text', 'long_text', 'name', 'email', 'phone', 'number', 'date'],
  },
  {
    title: 'Escolha',
    types: ['multiple_choice'],
  },
  {
    title: 'Estrutura',
    types: ['welcome', 'message', 'thank_you'],
  },
];

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface FieldTypeSelectorProps {
  onSelect: (type: FieldType) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// FieldTypeCard
// ─────────────────────────────────────────────

interface FieldTypeCardProps {
  type: FieldType;
  onClick: () => void;
}

function FieldTypeCard({ type, onClick }: FieldTypeCardProps) {
  const meta = FIELD_TYPE_META[type];

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-xl cursor-pointer',
        'border border-transparent transition-all duration-150',
        'hover:bg-[rgba(124,92,252,0.12)] hover:border-[rgba(124,92,252,0.4)]',
        'active:scale-95',
      )}
      style={{ width: 72, height: 72 }}
      title={meta.label}
    >
      <span
        className="text-[22px] leading-none select-none"
        aria-hidden="true"
      >
        {meta.icon}
      </span>
      <span className="text-[10px] font-medium text-[var(--text-secondary)] leading-none text-center px-1">
        {meta.label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// FieldTypeSelector
// ─────────────────────────────────────────────

export function FieldTypeSelector({ onSelect, onClose }: FieldTypeSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        ref={containerRef}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-full left-0 right-0 z-50 mb-2 mx-1"
        style={{
          background: 'var(--bg-surface-2)',
          borderRadius: '16px 16px 12px 12px',
          border: '1px solid var(--border-default)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-hairline)' }}
        >
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            Tipo de campo
          </span>
          <button
            onClick={onClose}
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded-full',
              'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
              'hover:bg-[var(--bg-hover)] transition-colors text-[16px] leading-none',
            )}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Sections */}
        <div className="px-3 py-3 flex flex-col gap-4 max-h-[380px] overflow-y-auto">
          {SECTIONS.map((section) => (
            <div key={section.title} className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] px-1">
                {section.title}
              </span>
              <div className="flex flex-wrap gap-1">
                {section.types.map((type) => (
                  <FieldTypeCard
                    key={type}
                    type={type}
                    onClick={() => {
                      onSelect(type);
                      onClose();
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
