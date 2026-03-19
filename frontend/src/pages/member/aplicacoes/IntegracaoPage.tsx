import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../lib/cn.ts';
import {
  updateTrackingConfig,
  updateNotificationConfig,
  applicationKeys,
  type TrackingConfig,
  type NotificationConfig,
} from '../../../api/applications.ts';
import type { ApplicationShellContext } from './ApplicationShell.tsx';

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      aria-label={text}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-help"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7.25 7.25C7.25 6.836 7.586 6.5 8 6.5s.75.336.75.75v4.5a.75.75 0 0 1-1.5 0V7.25ZM8 5.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
          fill="currentColor"
        />
      </svg>
      {visible && (
        <span
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
            'w-56 px-3 py-2 rounded-lg text-[11px] leading-relaxed',
            'bg-[var(--bg-elevated,#1c1c1e)] text-[var(--text-primary)] shadow-lg',
            'border border-[var(--border-hairline)] pointer-events-none',
          )}
          style={{ whiteSpace: 'normal' }}
        >
          {text}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderTopColor: 'var(--border-hairline)' }}
          />
        </span>
      )}
    </span>
  );
}

// ─── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({ title, isConfigured }: { title: string; isConfigured?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</h3>
      {isConfigured && (
        <span
          className="w-2 h-2 rounded-full bg-[#30d158] flex-shrink-0"
          title="Configurado"
        />
      )}
    </div>
  );
}

// ─── PixelField ────────────────────────────────────────────────────────────────

function PixelField({
  label,
  placeholder,
  value,
  active,
  onValueChange,
  onActiveChange,
  tooltip,
}: {
  label: string;
  placeholder: string;
  value: string;
  active: boolean;
  onValueChange: (v: string) => void;
  onActiveChange: (v: boolean) => void;
  tooltip?: string;
}) {
  return (
    <div
      className="p-4 rounded-xl mb-3"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</span>
          {tooltip && <Tooltip text={tooltip} />}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={() => onActiveChange(!active)}
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
            active ? 'bg-[var(--accent)]' : 'bg-[var(--border-hairline)]',
          )}
        >
          <span
            className={cn(
              'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
              active ? 'translate-x-[18px]' : 'translate-x-1',
            )}
          />
        </button>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full px-3 py-2 rounded-lg text-[13px] font-mono',
          'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
          'text-[var(--text-primary)] placeholder-[var(--text-tertiary)]',
          'focus:outline-none focus:border-[var(--accent)] transition-colors',
        )}
      />
    </div>
  );
}

// ─── MetaTestPanel ─────────────────────────────────────────────────────────────

function MetaTestPanel({
  pixelId,
  publicUrl,
}: {
  pixelId: string;
  publicUrl: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const hasPixelId = pixelId.trim().length > 0;

  function handleOpenTestEvents() {
    const id = pixelId.trim();
    const url = `https://www.facebook.com/events_manager2/list/pixel/${id}/test_events`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleOpenForm() {
    if (publicUrl) window.open(publicUrl, '_blank', 'noopener,noreferrer');
  }

  function handleTestBoth() {
    handleOpenTestEvents();
    setTimeout(() => handleOpenForm(), 400);
  }

  return (
    <div
      className="rounded-xl mb-3 overflow-hidden"
      style={{ border: '1px solid var(--border-hairline)' }}
    >
      {/* Header colapsável */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'text-[12px] font-semibold text-[var(--text-primary)]',
          'hover:bg-[var(--bg-surface-1)] transition-colors text-left',
        )}
        style={{ background: open ? 'var(--bg-surface-1)' : 'var(--bg-base)' }}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[var(--accent)] flex-shrink-0">
            <path
              d="M5.5 1v6.5L2 13.5A1 1 0 0 0 2.914 15h10.172A1 1 0 0 0 14 13.5L10.5 7.5V1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M4 1h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Como testar se o pixel está funcionando
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          className={cn('text-[var(--text-tertiary)] transition-transform', open ? 'rotate-180' : '')}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Conteúdo */}
      {open && (
        <div
          className="px-4 pb-4 pt-3 space-y-4"
          style={{ background: 'var(--bg-surface-1)', borderTop: '1px solid var(--border-hairline)' }}
        >
          {/* Como os eventos são enviados */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-primary)] mb-2">
              Como os eventos são enviados:
            </p>
            <div className="space-y-1.5">
              {[
                { layer: 'SDK (fbevents.js)', desc: 'Pixel padrão do Meta. Pode ser bloqueado por ad blockers.', color: '#7c5cfc' },
                { layer: 'Image pixel', desc: 'Disparo via imagem de 1px. Funciona mesmo sem o SDK carregar.', color: '#30a0ff' },
                { layer: 'Server-side', desc: 'Enviado pelo nosso servidor. Não é bloqueável por extensões do navegador.', color: '#30d158' },
              ].map((l) => (
                <div key={l.layer} className="flex items-start gap-2">
                  <span
                    className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                    style={{ background: l.color }}
                  />
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">{l.layer}:</strong> {l.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Passo-a-passo */}
          <ol className="space-y-2.5 text-[12px] text-[var(--text-secondary)] list-none">
            <li className="flex gap-2.5">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                1
              </span>
              <span>
                Salve o rastreamento com o ID do pixel preenchido e toggle{' '}
                <strong className="text-[var(--text-primary)]">ativo</strong>.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                2
              </span>
              <span>
                Clique em <strong className="text-[var(--text-primary)]">"Testar pixel agora"</strong>.
                Abre o Gerenciador de Eventos e o formulário ao mesmo tempo.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                3
              </span>
              <span>
                No Gerenciador, vá em <strong className="text-[var(--text-primary)]">Test Events</strong>{' '}
                e cole a URL do formulário. Preencha e envie. Eventos aparecem em tempo real.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                4
              </span>
              <span>
                Se não aparecer em <em>Test Events</em>, verifique a aba{' '}
                <strong className="text-[var(--text-primary)]">Overview → All Activity</strong>{' '}
                — eventos server-side aparecem ali (com 5-15min de delay).
              </span>
            </li>
          </ol>

          {/* Dica extensão */}
          <div
            className="flex gap-2 px-3 py-2.5 rounded-lg text-[11px] text-[var(--text-secondary)]"
            style={{ background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.2)' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-[#ffcc00] flex-shrink-0 mt-0.5">
              <path
                d="M8 1.5a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 8 1.5ZM8 5a.75.75 0 1 1 0 1.5A.75.75 0 0 1 8 5Zm-.75 2.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Z"
                fill="currentColor"
              />
            </svg>
            <span>
              <strong className="text-[var(--text-primary)]">Debug:</strong> Abra o formulário e
              aperte <strong className="text-[var(--text-primary)]">F12 → Console</strong>.
              Mensagens com prefixo <code className="font-mono">[pixel]</code> mostram exatamente
              o que está acontecendo. Se ver{' '}
              <code className="font-mono text-[#30d158]">[pixel] fbq → CompleteRegistration</code>{' '}
              o SDK funcionou. Se não ver, use a aba <em>Network</em> para verificar se{' '}
              <code className="font-mono">fbevents.js</code> foi bloqueado — mesmo assim, o envio
              server-side garante que o evento chegue ao Meta.
            </span>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={!hasPixelId}
              onClick={handleTestBoth}
              className={cn(
                'w-full py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5',
                hasPixelId
                  ? 'bg-[var(--accent)] text-white hover:opacity-90 cursor-pointer'
                  : 'bg-[var(--border-hairline)] text-[var(--text-tertiary)] cursor-not-allowed',
              )}
              title={!hasPixelId ? 'Preencha o ID do pixel e salve antes de testar' : undefined}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M5.5 1v6.5L2 13.5A1 1 0 0 0 2.914 15h10.172A1 1 0 0 0 14 13.5L10.5 7.5V1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M4 1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Testar pixel agora
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!hasPixelId}
                onClick={handleOpenTestEvents}
                className={cn(
                  'flex-1 py-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1',
                  hasPixelId
                    ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer'
                    : 'text-[var(--text-tertiary)] cursor-not-allowed',
                )}
                style={{ border: '1px solid var(--border-hairline)', background: 'var(--bg-base)' }}
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M7 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path d="M10 2h4v4M14 2l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Events Manager
              </button>

              {publicUrl && (
                <button
                  type="button"
                  onClick={handleOpenForm}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1',
                    'text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer',
                  )}
                  style={{ border: '1px solid var(--border-hairline)', background: 'var(--bg-base)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Abrir formulário
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── IntegracaoPage ────────────────────────────────────────────────────────────

export default function IntegracaoPage() {
  const { application } = useOutletContext<ApplicationShellContext>();
  const queryClient = useQueryClient();

  const existingSettings = application?.settings as Record<string, unknown> | undefined;
  const existingTracking = existingSettings?.tracking as TrackingConfig | undefined;
  const existingNotifs = existingSettings?.notifications as NotificationConfig | undefined;

  // Tracking state
  const [metaPixelId, setMetaPixelId] = useState(existingTracking?.metaPixelId || '');
  const [metaPixelActive, setMetaPixelActive] = useState(existingTracking?.metaPixelActive ?? false);
  const [metaLeadEvent, setMetaLeadEvent] = useState<'start' | 'submit'>(existingTracking?.metaLeadEvent ?? 'submit');
  const [ga4Id, setGa4Id] = useState(existingTracking?.ga4MeasurementId || '');
  const [ga4Active, setGa4Active] = useState(existingTracking?.ga4Active ?? false);
  const [tiktokId, setTiktokId] = useState(existingTracking?.tiktokPixelId || '');
  const [tiktokActive, setTiktokActive] = useState(existingTracking?.tiktokPixelActive ?? false);

  // Notification state
  const [emailEnabled, setEmailEnabled] = useState(existingNotifs?.emailEnabled ?? false);
  const [emailTo, setEmailTo] = useState(existingNotifs?.emailTo || '');
  const [emailCc, setEmailCc] = useState(existingNotifs?.emailCc || '');

  const [trackingSaved, setTrackingSaved] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    if (existingTracking) {
      setMetaPixelId(existingTracking.metaPixelId || '');
      setMetaPixelActive(existingTracking.metaPixelActive ?? false);
      setMetaLeadEvent(existingTracking.metaLeadEvent ?? 'submit');
      setGa4Id(existingTracking.ga4MeasurementId || '');
      setGa4Active(existingTracking.ga4Active ?? false);
      setTiktokId(existingTracking.tiktokPixelId || '');
      setTiktokActive(existingTracking.tiktokPixelActive ?? false);
    }
    if (existingNotifs) {
      setEmailEnabled(existingNotifs.emailEnabled ?? false);
      setEmailTo(existingNotifs.emailTo || '');
      setEmailCc(existingNotifs.emailCc || '');
    }
  }, [application?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const trackingMutation = useMutation({
    mutationFn: (tracking: TrackingConfig) => updateTrackingConfig(application!.id, tracking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(application!.id) });
      setTrackingSaved(true);
      setTimeout(() => setTrackingSaved(false), 2000);
    },
  });

  const notifMutation = useMutation({
    mutationFn: (notifs: NotificationConfig) => updateNotificationConfig(application!.id, notifs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(application!.id) });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    },
  });

  function handleSaveTracking() {
    if (!application) return;
    trackingMutation.mutate({
      metaPixelId: metaPixelId.trim() || undefined,
      metaPixelActive,
      metaLeadEvent,
      ga4MeasurementId: ga4Id.trim() || undefined,
      ga4Active,
      tiktokPixelId: tiktokId.trim() || undefined,
      tiktokPixelActive: tiktokActive,
    });
  }

  function handleSaveNotifs() {
    if (!application) return;
    notifMutation.mutate({
      emailEnabled,
      emailTo: emailTo.trim() || undefined,
      emailCc: emailCc.trim() || undefined,
      digestMode: 'instant',
    });
  }

  const isTrackingConfigured = !!(
    (metaPixelId && metaPixelActive) ||
    (ga4Id && ga4Active) ||
    (tiktokId && tiktokActive)
  );

  // URL pública do formulário para links de teste
  const publicFormUrl = application?.slug
    ? `${window.location.origin}/f/${application.slug}`
    : undefined;

  if (!application) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-xl mx-auto px-6 py-8 space-y-8">

        {/* Rastreamento */}
        <section>
          <SectionHeader title="Rastreamento" isConfigured={isTrackingConfigured} />
          <p className="text-[12px] text-[var(--text-secondary)] mb-4">
            Configure pixels de rastreamento para medir o desempenho das suas campanhas.
          </p>

          <PixelField
            label="Meta Pixel (Facebook / Instagram)"
            placeholder="Ex: 123456789012345"
            value={metaPixelId}
            active={metaPixelActive}
            onValueChange={setMetaPixelId}
            onActiveChange={setMetaPixelActive}
            tooltip="Encontre o ID no Gerenciador de Anúncios → Gerenciador de Eventos → selecione seu pixel → aba Configurações. O ID é numérico (ex: 762730812147902)."
          />
          <PixelField
            label="Google Analytics 4"
            placeholder="Ex: G-XXXXXXXXXX"
            value={ga4Id}
            active={ga4Active}
            onValueChange={setGa4Id}
            onActiveChange={setGa4Active}
            tooltip="Encontre o ID no Google Analytics → Administrador → Fluxos de dados → selecione seu site. O ID começa com G- (ex: G-AB12CD34EF)."
          />
          <PixelField
            label="TikTok Pixel"
            placeholder="Ex: XXXXXXXXXXXXXXXXXXXXXXXX"
            value={tiktokId}
            active={tiktokActive}
            onValueChange={setTiktokId}
            onActiveChange={setTiktokActive}
            tooltip="Encontre o ID no TikTok Ads Manager → Ativos → Eventos → Web Events → selecione seu pixel → Configurações. O ID é alfanumérico."
          />

          {/* Disparar Lead: início ou fim */}
          <div
            className="p-3 rounded-xl mb-3"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}
          >
            <p className="text-[12px] font-semibold text-[var(--text-primary)] mb-2">
              Quando disparar o evento <span className="font-mono text-[var(--accent)]">Lead</span>?
            </p>
            <div className="flex gap-2">
              {(['start', 'submit'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMetaLeadEvent(opt)}
                  className={cn(
                    'flex-1 py-1.5 px-3 rounded-lg text-[12px] font-medium transition-all border',
                    metaLeadEvent === opt
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'text-[var(--text-secondary)] border-[var(--border-hairline)] hover:border-[var(--accent)]',
                  )}
                >
                  {opt === 'start' ? 'Início do formulário' : 'Fim do formulário'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
              {metaLeadEvent === 'start'
                ? 'Lead dispara quando o usuário clica em "Começar". Útil para medir intenção.'
                : 'Lead dispara após o envio completo. Recomendado para qualidade de lead.'}
            </p>
          </div>

          {/* Eventos rastreados */}
          <div
            className="p-3 rounded-xl mb-3 text-[12px] text-[var(--text-secondary)]"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}
          >
            <p className="font-semibold text-[var(--text-primary)] mb-1">Eventos rastreados automaticamente:</p>
            <p>• Visualização do formulário → <span className="font-mono text-[var(--accent)]">PageView</span></p>
            {metaLeadEvent === 'start' && (
              <p>• Início do formulário → <span className="font-mono text-[var(--accent)]">Lead</span></p>
            )}
            <p>• Envio completo → <span className="font-mono text-[var(--accent)]">CompleteRegistration</span>{metaLeadEvent === 'submit' && <span> + <span className="font-mono text-[var(--accent)]">Lead</span></span>}</p>
          </div>

          {/* Painel de teste do Meta Pixel */}
          {(metaPixelActive || metaPixelId) && (
            <MetaTestPanel pixelId={metaPixelId} publicUrl={publicFormUrl} />
          )}

          <button
            onClick={handleSaveTracking}
            disabled={trackingMutation.isPending}
            className={cn(
              'w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
              trackingSaved
                ? 'bg-[rgba(48,209,88,0.12)] text-[#30d158] border border-[rgba(48,209,88,0.25)]'
                : 'bg-[var(--accent)] text-white hover:opacity-90',
            )}
          >
            {trackingMutation.isPending ? 'Salvando...' : trackingSaved ? '✓ Salvo' : 'Salvar rastreamento'}
          </button>
        </section>

        <div style={{ height: 1, background: 'var(--border-hairline)' }} />

        {/* Notificações */}
        <section>
          <SectionHeader title="Notificações" isConfigured={emailEnabled} />
          <p className="text-[12px] text-[var(--text-secondary)] mb-4">
            Receba um e-mail cada vez que alguém preencher este formulário.
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] text-[var(--text-primary)]">Notificar por e-mail</span>
            <button
              type="button"
              role="switch"
              aria-checked={emailEnabled}
              onClick={() => setEmailEnabled((v) => !v)}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                emailEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--border-hairline)]',
              )}
            >
              <span
                className={cn(
                  'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                  emailEnabled ? 'translate-x-[18px]' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          {emailEnabled && (
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] block mb-1">
                  Enviar para
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="seu@email.com"
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-[13px]',
                    'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                    'text-[var(--text-primary)] placeholder-[var(--text-tertiary)]',
                    'focus:outline-none focus:border-[var(--accent)] transition-colors',
                  )}
                />
              </div>
              <div>
                <label className="text-[12px] text-[var(--text-secondary)] block mb-1">
                  CC (opcional)
                </label>
                <input
                  type="email"
                  value={emailCc}
                  onChange={(e) => setEmailCc(e.target.value)}
                  placeholder="outro@email.com"
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-[13px]',
                    'bg-[var(--bg-surface-1)] border border-[var(--border-hairline)]',
                    'text-[var(--text-primary)] placeholder-[var(--text-tertiary)]',
                    'focus:outline-none focus:border-[var(--accent)] transition-colors',
                  )}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSaveNotifs}
            disabled={notifMutation.isPending}
            className={cn(
              'w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
              notifSaved
                ? 'bg-[rgba(48,209,88,0.12)] text-[#30d158] border border-[rgba(48,209,88,0.25)]'
                : 'bg-[var(--accent)] text-white hover:opacity-90',
            )}
          >
            {notifMutation.isPending ? 'Salvando...' : notifSaved ? '✓ Salvo' : 'Salvar notificações'}
          </button>
        </section>
      </div>
    </div>
  );
}
