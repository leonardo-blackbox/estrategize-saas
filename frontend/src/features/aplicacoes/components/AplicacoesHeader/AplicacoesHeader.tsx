import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button.tsx';
import { cn } from '../../../../lib/cn.ts';

interface AplicacoesHeaderProps {
  onCreateClick: () => void;
  onTemplatesClick: () => void;
}

export function AplicacoesHeader({ onCreateClick, onTemplatesClick }: AplicacoesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div>
        <nav className="flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] mb-3">
          <Link
            to="/ferramentas"
            className="hover:text-[var(--text-secondary)] transition-colors"
          >
            ← Ferramentas
          </Link>
          <span className="opacity-40">·</span>
          <span className="text-[var(--text-secondary)]">Aplicações</span>
        </nav>

        <h1 className="text-[24px] sm:text-[28px] font-bold text-[var(--text-primary)] leading-tight">
          Aplicações
        </h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-1">
          Formulários inteligentes para coletar dados dos seus clientes.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 self-start">
        <button
          onClick={onTemplatesClick}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium',
            'border border-[var(--border-hairline)] text-[var(--text-secondary)]',
            'hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer',
          )}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Templates
        </button>
        <Button onClick={onCreateClick} className="gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Nova Aplicação
        </Button>
      </div>
    </div>
  );
}
