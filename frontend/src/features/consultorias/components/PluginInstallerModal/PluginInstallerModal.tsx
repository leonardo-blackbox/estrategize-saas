import { useEffect } from 'react';
import { useConsultoriaPlugins } from '../../hooks/useConsultoriaPlugins.ts';

interface PluginInstallerModalProps {
  consultancyId: string;
  onClose: () => void;
}

export function PluginInstallerModal({ consultancyId, onClose }: PluginInstallerModalProps) {
  const {
    catalog,
    installedSlugs,
    install,
    uninstall,
    isInstalling,
    isUninstalling,
  } = useConsultoriaPlugins(consultancyId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-lg)] shadow-2xl"
        style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-default)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-hairline)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Instalar Plugin</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Expanda sua consultoria com ferramentas especializadas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plugin list */}
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {catalog.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] text-center py-8">Carregando plugins...</p>
          ) : (
            catalog.map((plugin) => {
              const isInstalled = installedSlugs.has(plugin.slug);
              return (
                <div
                  key={plugin.slug}
                  className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)]"
                >
                  <div
                    className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center text-lg shrink-0 mt-0.5"
                    style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}
                  >
                    {plugin.icon ?? '🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{plugin.name}</span>
                      {plugin.is_free && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}
                        >
                          GRÁTIS
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed mb-2">
                      {plugin.description}
                    </p>
                    {plugin.features && plugin.features.length > 0 && (
                      <ul className="space-y-0.5 mb-2">
                        {plugin.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                            <span className="text-[#34d399]">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      onClick={() => isInstalled ? uninstall(plugin.slug) : install(plugin.slug)}
                      disabled={isInstalling || isUninstalling}
                      className="text-[11px] font-medium px-3 py-1 rounded-[var(--radius-sm)] transition-all disabled:opacity-50"
                      style={
                        isInstalled
                          ? { background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' }
                          : { background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.3)', color: '#7c5cfc' }
                      }
                    >
                      {isInstalled ? 'Remover' : 'Instalar'}
                    </button>
                  </div>
                  {isInstalled && (
                    <span className="text-[10px] text-[#34d399] font-medium shrink-0 mt-1">✓ Instalado</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-hairline)]">
          <p className="text-[11px] text-[var(--text-tertiary)] text-center">
            Mais ferramentas em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
