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
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <p className="text-sm text-slate-400">Loading credits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!balance) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
        Credit Balance
      </h3>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{balance.available}</span>
        <span className="text-sm text-slate-400">available</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-slate-500">Reserved</p>
          <p className="text-sm font-medium text-amber-400">{balance.reserved}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Used (month)</p>
          <p className="text-sm font-medium text-slate-300">{balance.consumed_this_month}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total Used</p>
          <p className="text-sm font-medium text-slate-300">{balance.total_consumed}</p>
        </div>
      </div>
    </div>
  );
}
