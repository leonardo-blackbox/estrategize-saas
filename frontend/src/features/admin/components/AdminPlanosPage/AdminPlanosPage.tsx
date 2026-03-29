export function AdminPlanosPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-3">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg-surface-1)] mb-2">
        <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[var(--text-primary)]">Planos e Stripe</p>
      <p className="text-xs text-[var(--text-tertiary)]">
        Gerencie planos de assinatura e configuracoes do Stripe. Em construcao.
      </p>
    </div>
  );
}
