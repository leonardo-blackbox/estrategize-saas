import { useState, useCallback } from 'react';
import { CreditBalanceCard } from '../components/credits/CreditBalanceCard.tsx';
import { TransactionHistory } from '../components/credits/TransactionHistory.tsx';
import { grantCredits } from '../api/credits.ts';

export function CreditsPage() {
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGrant = useCallback(async () => {
    setGranting(true);
    setGrantError('');
    try {
      await grantCredits({ amount: 10, type: 'purchase', description: 'Test credit grant' });
      // Force refresh of balance and transactions
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setGrantError(err instanceof Error ? err.message : 'Failed to grant credits');
    } finally {
      setGranting(false);
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Credits</h1>
        <button
          onClick={handleGrant}
          disabled={granting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {granting ? 'Granting...' : 'Grant 10 Credits (Test)'}
        </button>
      </div>

      {grantError && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2">
          <p className="text-sm text-red-400">{grantError}</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Balance card -- takes 1 column */}
        <div>
          <CreditBalanceCard key={`balance-${refreshKey}`} />
        </div>

        {/* Transaction history -- takes 2 columns */}
        <div className="lg:col-span-2">
          <TransactionHistory key={`txns-${refreshKey}`} />
        </div>
      </div>
    </div>
  );
}
