import { motion } from 'framer-motion';
import { staggerItem } from '../../../../lib/motion.ts';

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorVar: string;
  bgVar: string;
}

export function KpiCard({ label, value, icon, colorVar, bgVar }: KpiCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      className="flex items-center gap-3 rounded-[var(--radius-md)] p-4 border border-[var(--border-hairline)] bg-[var(--bg-surface-1)]"
      style={{ borderLeftColor: `var(${colorVar})`, borderLeftWidth: 2 }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
        style={{ background: `var(${bgVar})`, color: `var(${colorVar})` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[22px] font-bold leading-none text-[var(--text-primary)]">{value}</p>
        <p className="mt-0.5 text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
          {label}
        </p>
      </div>
    </motion.div>
  );
}
