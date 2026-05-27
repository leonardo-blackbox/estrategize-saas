import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMetaConnection } from '../../hooks/useMetaConnection.ts';

interface Props {
  consultancyId: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Sessão de conexão expirou. Tente novamente.',
  exchange_failed: 'Não foi possível conectar com o Instagram. Tente novamente.',
  not_business_account: 'Sua conta precisa ser Instagram Business para conectar.',
  missing_params: 'Resposta inválida do Instagram. Tente novamente.',
  access_denied: 'Você cancelou a autorização.',
};

export function ConnectInstagramButton({ consultancyId }: Props) {
  const { connection, isLoading, connect, isConnecting, disconnect, isDisconnecting } =
    useMetaConnection(consultancyId);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (searchParams.get('meta_connected') === '1') {
      setToast({ type: 'success', message: 'Instagram conectado com sucesso!' });
      searchParams.delete('meta_connected');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setToast(null), 4500);
    }
    const err = searchParams.get('meta_error');
    if (err) {
      setToast({
        type: 'error',
        message: ERROR_MESSAGES[err] ?? `Erro ao conectar: ${err}`,
      });
      searchParams.delete('meta_error');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setToast(null), 6500);
    }
  }, [searchParams, setSearchParams, navigate]);

  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-1)] p-4 text-sm text-[var(--text-tertiary)]">
        Verificando conexão...
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div
          role="status"
          className={`mb-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border border-red-500/30'
          }`}
        >
          {toast.message}
        </div>
      )}

      {!connection && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-gradient-to-br from-[var(--bg-surface-1)] to-[var(--bg-surface-2)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-2xl">
              📷
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">
                Conecte o Instagram da consultoria
              </h3>
              <p className="text-[13px] text-[var(--text-tertiary)] mb-3 leading-relaxed">
                Acesse demografia real, saves, shares, watch time dos Reels e audiência engajada — dados
                oficiais via Meta, não mais scraping.
              </p>
              <button
                type="button"
                onClick={() => connect()}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
              >
                {isConnecting ? 'Abrindo Instagram...' : 'Conectar Instagram'}
              </button>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                Requer conta Instagram Business.
              </p>
            </div>
          </div>
        </div>
      )}

      {connection?.status === 'active' && (
        <div className="rounded-[var(--radius-lg)] border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              <div>
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                  @{connection.ig_username}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Instagram {connection.account_type} conectado · dados oficiais ativos
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Desconectar o Instagram desta consultoria?')) {
                  disconnect();
                }
              }}
              disabled={isDisconnecting}
              className="text-[12px] text-[var(--text-tertiary)] hover:text-red-400 underline disabled:opacity-50"
            >
              {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        </div>
      )}

      {connection && connection.status !== 'active' && (
        <div className="rounded-[var(--radius-lg)] border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                Conexão {connection.status === 'expired' ? 'expirada' : connection.status === 'revoked' ? 'revogada' : 'com erro'}
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                @{connection.ig_username}{connection.last_error ? ` · ${connection.last_error}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => connect()}
              disabled={isConnecting}
              className="rounded-[var(--radius-md)] bg-amber-500/20 px-3 py-1.5 text-[12px] font-semibold text-amber-200 hover:bg-amber-500/30 disabled:opacity-50"
            >
              {isConnecting ? 'Reconectando...' : 'Reconectar'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
