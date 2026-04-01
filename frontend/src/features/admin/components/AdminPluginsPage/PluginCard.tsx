import { Link } from 'react-router-dom';
import type { AdminPlugin } from '../../../../api/adminPlugins.ts';

function IconPuzzle() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.421 48.421 0 0 1-4.185-.069c-.547-.044-.958-.497-.958-1.045v-1.16c0-.355-.186-.676-.401-.959A1.647 1.647 0 0 1 6.5 3.125c0-1.036 1.007-1.875 2.25-1.875S11 2.089 11 3.125c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .354.29.643.644.643h1.16c.547 0 1-.41 1.045-.957a48.51 48.51 0 0 1 .069-4.185.64.64 0 0 0-.643-.658v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401v0a.64.64 0 0 0 .657-.643 48.421 48.421 0 0 0-.069-4.185c-.044-.547-.497-.958-1.045-.958h-1.16" />
    </svg>
  );
}

interface PluginCardProps {
  plugin: AdminPlugin;
}

export function PluginCard({ plugin }: PluginCardProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--bg-hover)] flex items-center justify-center shrink-0 text-[var(--text-secondary)]">
          {plugin.icon ? (
            <span className="text-lg">{plugin.icon}</span>
          ) : (
            <IconPuzzle />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{plugin.name}</p>
          <p className="text-xs text-[var(--text-tertiary)] font-mono">{plugin.slug}</p>
        </div>
      </div>

      {/* Description */}
      {plugin.description && (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{plugin.description}</p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
          plugin.is_free
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-violet-500/10 text-violet-400'
        }`}>
          {plugin.is_free ? 'Gratuito' : 'Premium'}
        </span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
          plugin.is_active
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          {plugin.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Action */}
      <Link
        to={`/admin/plugins/${plugin.slug}`}
        className="mt-auto inline-flex items-center justify-center px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-primary)] hover:bg-[var(--border-hairline)] transition-colors"
      >
        Configurar
      </Link>
    </div>
  );
}
