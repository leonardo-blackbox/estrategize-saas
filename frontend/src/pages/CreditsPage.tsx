import { CreditBalanceCard } from '../components/credits/CreditBalanceCard.tsx';
import { TransactionHistory } from '../components/credits/TransactionHistory.tsx';

export function CreditsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Credits</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Balance card — takes 1 column */}
        <div>
          <CreditBalanceCard />
        </div>

        {/* Transaction history — takes 2 columns */}
        <div className="lg:col-span-2">
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
