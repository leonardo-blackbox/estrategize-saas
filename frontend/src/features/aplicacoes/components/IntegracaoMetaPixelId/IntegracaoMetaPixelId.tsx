import { cn } from '../../../../lib/cn.ts';
import { IntegracaoTooltip } from '../IntegracaoTooltip';

interface IntegracaoMetaPixelIdProps {
  pixelId: string;
  onPixelIdChange: (v: string) => void;
  active: boolean;
  onActiveChange: (v: boolean) => void;
}

export function IntegracaoMetaPixelId({ pixelId, onPixelIdChange, active, onActiveChange }: IntegracaoMetaPixelIdProps) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--text-primary)]">Pixel ID</span>
          <IntegracaoTooltip text="Encontre o ID no Gerenciador de Anúncios → Gerenciador de Eventos → selecione seu pixel → aba Configurações. O ID é numérico (ex: 762730812147902)." />
        </div>
        <button
          type="button" role="switch" aria-checked={active}
          onClick={() => onActiveChange(!active)}
          className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', active ? 'bg-[var(--accent)]' : 'bg-[var(--border-hairline)]')}
        >
          <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', active ? 'translate-x-[18px]' : 'translate-x-1')} />
        </button>
      </div>
      <input
        type="text" value={pixelId} onChange={(e) => onPixelIdChange(e.target.value)} placeholder="Ex: 123456789012345"
        className={cn('w-full px-3 py-2 rounded-lg text-[13px] font-mono', 'bg-[var(--bg-base)] border border-[var(--border-hairline)]', 'text-[var(--text-primary)] placeholder-[var(--text-tertiary)]', 'focus:outline-none focus:border-[var(--accent)] transition-colors')}
      />
    </div>
  );
}
