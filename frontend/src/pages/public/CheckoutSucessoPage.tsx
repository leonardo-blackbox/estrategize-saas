import { Link } from 'react-router-dom';

export function CheckoutSucessoPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      <div
        style={{
          maxWidth: '32rem',
          width: '100%',
          backgroundColor: 'var(--color-bg-elevated)',
          borderRadius: '1rem',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(34,197,94,0.1)',
            color: 'rgb(34,197,94)',
            marginBottom: '1.5rem',
          }}
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Pagamento confirmado!
        </h1>

        <p
          style={{
            color: 'var(--color-text-secondary)',
            lineHeight: '1.6',
            marginBottom: '2rem',
          }}
        >
          Seu acesso sera liberado em instantes. Voce recebera um email com os proximos passos.
        </p>

        <Link
          to="/formacao"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--iris-violet, #7c5cfc)',
            color: '#fff',
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          Ir para o dashboard
        </Link>

        <div>
          <Link
            to="/planos"
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              textDecoration: 'underline',
            }}
          >
            Voltar para planos
          </Link>
        </div>
      </div>
    </div>
  );
}
