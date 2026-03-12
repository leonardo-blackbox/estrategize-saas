import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { staggerContainer, staggerItem } from '../../lib/motion.ts';
import { cn } from '../../lib/cn.ts';
import { Button } from '../../components/ui/Button.tsx';
import { fetchBalance, fetchTransactions } from '../../api/credits.ts';

const TX_LABEL: Record<string, string> = {
  purchase: 'Compra',
  monthly_grant: 'Mensal',
  reserve: 'Reserva',
  consume: 'Consumo',
  release: 'Liberação',
};

const CREDIT_TYPES = new Set(['purchase', 'monthly_grant', 'release']);

export function CreditosPage() {
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: fetchBalance,
    staleTime: 30_000,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['credit-transactions'],
    queryFn: () => fetchTransactions(20, 0),
  });

  const balance = balanceData?.data;
  const transactions = txData?.data ?? [];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Créditos</h1>
      </motion.div>

      {/* Balance card */}
      <motion.div
        variants={staggerItem}
        className="rounded-[var(--radius-lg)] p-5 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] shadow-[var(--shadow-soft)]"
      >
        {balanceLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-28 rounded animate-pulse bg-[var(--bg-hover)]" />
            <div className="h-10 w-20 rounded animate-pulse bg-[var(--bg-hover)]" />
          </div>
        ) : (
          <>
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Saldo disponível</div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {balance?.available ?? 0}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">créditos</div>
            {(balance?.reserved ?? 0) > 0 && (
              <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                {balance!.reserved} reservados (em uso)
              </div>
            )}
            {(balance?.consumed_this_month ?? 0) > 0 && (
              <div className="text-xs text-[var(--text-tertiary)]">
                {balance!.consumed_this_month} usados este mês
              </div>
            )}
          </>
        )}
        <Button size="sm" className="mt-4">
          Comprar créditos
        </Button>
      </motion.div>

      {/* Transaction ledger */}
      <motion.div variants={staggerItem}>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Histórico</h3>
        {txLoading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-surface-1)]" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-[var(--radius-md)] p-8 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)] text-center">
            <p className="text-sm text-[var(--text-tertiary)]">Nenhuma transação registrada.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => {
              const isCredit = CREDIT_TYPES.has(tx.type);
              const displayAmount = isCredit ? `+${tx.amount}` : `-${tx.amount}`;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] px-4 py-3 bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                        {TX_LABEL[tx.type] ?? tx.type}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)] truncate mt-0.5">{tx.description ?? '—'}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                      {new Date(tx.created_at).toLocaleString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={cn(
                    'text-sm font-semibold shrink-0',
                    isCredit ? 'text-emerald-500' : 'text-[var(--text-secondary)]',
                  )}>
                    {displayAmount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
