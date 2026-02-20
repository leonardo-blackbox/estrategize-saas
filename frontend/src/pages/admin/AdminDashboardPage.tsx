import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';

const stats = [
  { label: 'Usuarios ativos', value: '1,247' },
  { label: 'Consultorias abertas', value: '89' },
  { label: 'Receita MRR', value: 'R$ 47.800' },
  { label: 'Creditos consumidos (mes)', value: '2,340' },
];

export function AdminDashboardPage() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Admin Dashboard</h1>
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
          >
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
