import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../../../lib/motion.ts';
import { fetchAdminPlugins, adminPluginKeys } from '../../../../api/adminPlugins.ts';
import { PluginCard } from './PluginCard.tsx';

export function AdminPluginsPage() {
  const {
    data: plugins = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: adminPluginKeys.all(),
    queryFn: fetchAdminPlugins,
  });

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Plugins</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Gerencie plugins e suas configuracoes.
        </p>
      </motion.div>

      {/* Content */}
      <motion.div variants={staggerItem}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius-md)] p-6 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center space-y-1">
            <p className="text-sm text-red-500 font-medium">Erro ao carregar plugins</p>
            <p className="text-xs text-[var(--text-tertiary)] font-mono break-all">
              {(error as Error).message}
            </p>
          </div>
        ) : plugins.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-10 text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhum plugin cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plugins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
