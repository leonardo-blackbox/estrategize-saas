import { motion } from 'framer-motion';

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  accentColor: string;
}

export function KpiCard({ label, value, icon, gradient, glowColor, accentColor }: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="relative rounded-[var(--radius-md)] p-4 overflow-hidden cursor-default select-none"
      style={{
        background: gradient,
        boxShadow: `0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px -4px ${glowColor}`,
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Shine top edge */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
      />

      {/* Icon orb */}
      <div
        className="absolute top-3 right-3 w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.08)', color: accentColor }}
      >
        {icon}
      </div>

      {/* Value */}
      <p
        className="text-[36px] font-bold leading-none tracking-tight"
        style={{ color: '#fff', textShadow: `0 0 24px ${accentColor}80` }}
      >
        {value}
      </p>

      {/* Label */}
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </p>
    </motion.div>
  );
}
