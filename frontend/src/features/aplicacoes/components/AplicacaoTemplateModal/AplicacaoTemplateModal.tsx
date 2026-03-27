import { cn } from '../../../../lib/cn.ts';
import type { ApplicationTemplate } from '../../../../api/applications.ts';

interface AplicacaoTemplateModalProps {
  templates: ApplicationTemplate[] | undefined;
  onSelect: (templateId: string) => void;
  onClose: () => void;
  isCreating: boolean;
}

export function AplicacaoTemplateModal({ templates, onSelect, onClose, isCreating }: AplicacaoTemplateModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Escolha um template</h2>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">Comece com um formulário pré-configurado</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates ? templates.map((t) => (
            <button
              key={t.id} onClick={() => onSelect(t.id)} disabled={isCreating}
              className={cn('text-left p-4 rounded-xl cursor-pointer transition-all border border-[var(--border-hairline)] hover:border-[var(--accent)] hover:bg-[var(--bg-hover)] group')}
              style={{ background: 'var(--bg-base)' }}
            >
              <div className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center text-white text-[18px] font-bold" style={{ background: t.thumbnail_color }}>◉</div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors">{t.name}</p>
              {t.description && <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{t.description}</p>}
            </button>
          )) : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--border-hairline)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
