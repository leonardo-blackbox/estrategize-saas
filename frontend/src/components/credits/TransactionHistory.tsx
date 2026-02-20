import { useState, useEffect } from 'react';
import { fetchTransactions, type CreditTransaction } from '../../api/credits.ts';

const typeLabel: Record<string, string> = {
  purchase: 'Purchase',
  monthly_grant: 'Monthly Grant',
  reserve: 'Reserve',
  consume: 'Consume',
  release: 'Release',
};

const typeColor: Record<string, string> = {
  purchase: 'text-green-400',
  monthly_grant: 'text-green-400',
  reserve: 'text-amber-400',
  consume: 'text-red-400',
  release: 'text-blue-400',
};

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-green-500/20 text-green-400',
  released: 'bg-blue-500/20 text-blue-400',
};

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError('');
        const res = await fetchTransactions(20);
        if (!cancelled) setTransactions(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load transactions');
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
        <p className="text-sm text-slate-400">Loading transactions...</p>
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

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
      <div className="p-5 border-b border-slate-700">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          Transaction History
        </h3>
      </div>

      {transactions.length === 0 ? (
        <div className="p-5 text-center">
          <p className="text-sm text-slate-500">No transactions yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="px-5 py-3 text-xs font-medium text-slate-400 uppercase">Type</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-400 uppercase">Amount</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-400 uppercase">Date</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-400 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`font-medium ${typeColor[tx.type] ?? 'text-slate-300'}`}>
                      {typeLabel[tx.type] ?? tx.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white font-mono">
                    {tx.type === 'consume' || tx.type === 'reserve'
                      ? `-${tx.amount}`
                      : `+${tx.amount}`}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[tx.status] ?? ''}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3 text-slate-400 truncate max-w-[200px]">
                    {tx.description ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
