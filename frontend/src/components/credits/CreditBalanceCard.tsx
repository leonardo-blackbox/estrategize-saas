import { useState, useEffect } from 'react';
import { fetchBalance, type CreditBalance } from '../../api/credits.ts';

export function CreditBalanceCard() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError('');
        const res = await fetchBalance();
        if (!cancelled) setBalance(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load balance');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-[15px] text-[var(--text-secondary)] animate-pulse">Loading credits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-6">
        <p className="text-[15px] text-[var(--color-error)]">{error}</p>
      </div>
    );
  }

  if (!balance) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-6 shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--bg-hover)]">
      <h3 className="text-[13px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
        Credit Balance
      </h3>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-[40px] font-bold tracking-tight text-[var(--text-primary)]">{balance.available}</span>
        <span className="text-[15px] font-medium text-[var(--text-secondary)]">available</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-t border-[var(--border-hairline)] pt-5">
        <div>
          <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Reserved</p>
          <p className="mt-1 text-[17px] font-semibold text-[var(--color-warning)]">{balance.reserved}</p>
        </div>
        <div>
          <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Used (month)</p>
          <p className="mt-1 text-[17px] font-semibold text-[var(--text-primary)]">{balance.consumed_this_month}</p>
        </div>
        <div>
          <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Total Used</p>
          <p className="mt-1 text-[17px] font-semibold text-[var(--text-primary)]">{balance.total_consumed}</p>
        </div>
      </div>
    </div>
  );
}
