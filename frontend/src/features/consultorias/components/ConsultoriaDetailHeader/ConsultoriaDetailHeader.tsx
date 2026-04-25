import { Link } from 'react-router-dom';
import type { Consultancy } from '../../services/consultorias.api.ts';
import { HeaderIdentity } from './HeaderIdentity.tsx';

interface ConsultoriaDetailHeaderProps {
  consultancy: Consultancy;
  onEditClick: () => void;
}

export function ConsultoriaDetailHeader({ consultancy, onEditClick }: ConsultoriaDetailHeaderProps) {
  const isActive = consultancy.status === 'active';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          to="/consultorias"
          className="group inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="font-medium">Consultorias</span>
          <span className="text-[var(--text-muted)] mx-0.5">/</span>
          <span className="text-[var(--text-secondary)] truncate max-w-[260px]">
            {consultancy.client_name || consultancy.title}
          </span>
        </Link>

        <button
          type="button"
          onClick={onEditClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium cursor-pointer
            text-[var(--text-secondary)] hover:text-[var(--text-primary)]
            transition-all duration-200 active:scale-95"
          style={{
            background: 'color-mix(in srgb, var(--bg-surface-1) 60%, transparent)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(12px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
            boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255,255,255,0.04)',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          Editar Dados
        </button>
      </div>

      <HeaderIdentity consultancy={consultancy} isActive={isActive} />
    </div>
  );
}
