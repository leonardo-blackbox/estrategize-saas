import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Button } from '../../components/ui/Button.tsx';

const mockTransactions = [
  { id: '1', type: 'consume' as const, amount: -1, description: 'Diagnostico IA — Plano Estrategico 2026', date: '2026-02-20 14:30' },
  { id: '2', type: 'consume' as const, amount: -1, description: 'Diagnostico IA — Reestruturacao Comercial', date: '2026-02-18 10:15' },
  { id: '3', type: 'purchase' as const, amount: 20, description: 'Compra — Pacote 20 creditos', date: '2026-02-15 09:00' },
  { id: '4', type: 'consume' as const, amount: -1, description: 'Analise SWOT — Acme Corp', date: '2026-02-10 16:45' },
  { id: '5', type: 'bonus' as const, amount: 25, description: 'Bonus de boas-vindas — Plano Pro', date: '2026-02-01 00:00' },
];

export function CreditosPage() {
  const balance = 42;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Creditos</h1>
      </motion.div>

      {/* Balance card */}
      <motion.div
        variants={staggerItem}
        className="rounded-[var(--radius-lg)] p-5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] shadow-[var(--shadow-soft)]"
      >
        <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Saldo disponivel</div>
        <div className="text-3xl font-bold text-[var(--text-primary)]">{balance}</div>
        <div className="text-xs text-[var(--text-tertiary)] mt-1">creditos</div>
        <Button size="sm" className="mt-4">
          Comprar creditos
        </Button>
      </motion.div>

      {/* Transaction ledger */}
      <motion.div variants={staggerItem}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Historico</h3>
        <div className="space-y-1">
          {mockTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] px-4 py-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--text-primary)] truncate">{tx.description}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{tx.date}</p>
              </div>
              <span className={cn(
                'text-sm font-semibold shrink-0',
                tx.amount > 0 ? 'text-[var(--color-success)]' : 'text-[var(--text-secondary)]',
              )}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
