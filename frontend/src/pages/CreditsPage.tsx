import { useState, useCallback } from 'react';
import { CreditBalanceCard } from '../components/credits/CreditBalanceCard.tsx';
import { TransactionHistory } from '../components/credits/TransactionHistory.tsx';
import { grantCredits } from '../api/credits.ts';
import { Button } from '../components/ui/Button.tsx';

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
        <h1 className="text-[24px] font-semibold tracking-tight text-[var(--text-primary)]">Credits</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={handleGrant}
          disabled={granting}
        >
          {granting ? 'Granting...' : 'Grant 10 Credits (Test)'}
        </Button>
      </div>

      {grantError && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-2">
          <p className="text-sm text-[var(--color-error)]">{grantError}</p>
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
