import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlans } from '../../hooks/usePlans.ts';
import { useCheckout } from '../../hooks/useCheckout.ts';
import { useAuthStore } from '../../../../stores/authStore.ts';
import { PlanCard } from '../PlanCard';

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[var(--bg-surface-1)] animate-pulse h-72" />
  );
}

export function PlanosPage() {
  const { data: plans, isLoading } = usePlans();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const checkout = useCheckout();
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  function handleSubscribe(planId: string) {
    if (!user) {
      navigate('/login', { state: { from: '/planos' } });
      return;
    }
    setActivePlanId(planId);
    checkout.mutate(planId);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Nossos Planos</h1>
          <p className="text-[var(--text-secondary)]">Escolha o plano ideal para o seu negocio</p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!isLoading && (!plans || plans.length === 0) && (
          <div className="text-center py-16">
            <p className="text-[var(--text-secondary)]">Nenhum plano disponivel no momento.</p>
          </div>
        )}

        {!isLoading && plans && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSubscribe={handleSubscribe}
                isLoading={checkout.isPending && activePlanId === plan.id}
                error={activePlanId === plan.id && checkout.error ? checkout.error.message : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
