import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';

export function AdminUsuariosPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Usuarios</h1>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Visualize entitlements e gerencie acessos.
        </p>
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] flex items-center justify-center"
      >
        <p className="text-sm text-[var(--text-tertiary)]">
          Entitlements view (placeholder)
        </p>
      </motion.div>
    </motion.div>
  );
}
