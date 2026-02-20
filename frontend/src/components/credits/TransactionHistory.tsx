import { useState, useEffect } from 'react';
import { fetchTransactions, type CreditTransaction } from '../../api/credits.ts';

const typeLabel: Record<string, string> = {
  purchase: 'Purchase',
  monthly_grant: 'Monthly Grant',
  reserve: 'Reserve',
  consume: 'Consume',
  release: 'Release',
};

const typeStyle: Record<string, string> = {
  purchase: 'text-[var(--color-success)]',
  monthly_grant: 'text-[var(--color-success)]',
  reserve: 'text-[var(--color-warning)]',
  consume: 'text-[var(--color-error)]',
  release: 'text-[var(--text-secondary)]',
};

const statusBadge: Record<string, string> = {
  pending: 'bg-[var(--bg-hover)] text-[var(--color-warning)]',
  confirmed: 'bg-[var(--bg-hover)] text-[var(--color-success)]',
  released: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
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
      <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-5">
        <p className="text-sm text-[var(--text-secondary)] animate-pulse">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-5">
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] overflow-hidden">
      <div className="p-5 border-b border-[var(--border-hairline)]">
        <h3 className="text-sm font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
          Transaction History
        </h3>
      </div>

      {transactions.length === 0 ? (
        <div className="p-5 text-center">
          <p className="text-sm text-[var(--text-muted)]">No transactions yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-surface-2)]">
              <tr>
                <th className="px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Type</th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Amount</th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Date</th>
                <th className="px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-5 py-3">
                    <span className={`font-medium ${typeStyle[tx.type] ?? 'text-[var(--text-secondary)]'}`}>
                      {typeLabel[tx.type] ?? tx.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-primary)] font-mono">
                    {tx.type === 'consume' || tx.type === 'reserve'
                      ? `-${tx.amount}`
                      : `+${tx.amount}`}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-medium ${statusBadge[tx.status] ?? ''}`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-tertiary)]">
                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-tertiary)] truncate max-w-[200px]">
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
