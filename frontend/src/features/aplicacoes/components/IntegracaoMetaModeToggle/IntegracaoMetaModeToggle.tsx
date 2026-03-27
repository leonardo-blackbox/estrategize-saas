import { cn } from '../../../../lib/cn.ts';

interface IntegracaoMetaModeToggleProps {
  mode: 'pixel' | 'capi';
  onModeChange: (v: 'pixel' | 'capi') => void;
}

export function IntegracaoMetaModeToggle({ mode, onModeChange }: IntegracaoMetaModeToggleProps) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <p className="text-[12px] font-semibold text-[var(--text-primary)] mb-2">Modo de envio</p>
      <div className="flex p-0.5 rounded-lg" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)' }}>
        <button type="button" onClick={() => onModeChange('pixel')}
          className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[12px] font-medium transition-all', mode === 'pixel' ? 'bg-[var(--bg-surface-1)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]')}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5 6.5h6M5 9.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          Pixel Normal
        </button>
        <button type="button" onClick={() => onModeChange('capi')}
          className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[12px] font-medium transition-all', mode === 'capi' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]')}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 8h3l2-5 2 10 2-5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          API de Conversões
        </button>
      </div>
      <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
        {mode === 'pixel'
          ? 'Disparo via browser (fbevents.js). Pode ser bloqueado por ad blockers e iOS 14+.'
          : 'Envio server-side com dados hasheados. Imune a bloqueadores. Requer Access Token.'}
      </p>
    </div>
  );
}
