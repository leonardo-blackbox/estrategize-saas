import { useState, useEffect } from 'react';
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

function PixelField({
  label,
  placeholder,
  value,
  active,
  onValueChange,
  onActiveChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  active: boolean;
  onValueChange: (v: string) => void;
  onActiveChange: (v: boolean) => void;
}) {
  return (
    <div
      className="p-4 rounded-xl mb-3"
      style={{ background: 'var(--bg-base)', border: '1px solid var(--border-hairline)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</span>
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

export default function IntegracaoPage() {
  const { application } = useOutletContext<ApplicationShellContext>();
  const queryClient = useQueryClient();

  const existingSettings = application?.settings as Record<string, unknown> | undefined;
  const existingTracking = existingSettings?.tracking as TrackingConfig | undefined;
  const existingNotifs = existingSettings?.notifications as NotificationConfig | undefined;

  // Tracking state
  const [metaPixelId, setMetaPixelId] = useState(existingTracking?.metaPixelId || '');
  const [metaPixelActive, setMetaPixelActive] = useState(existingTracking?.metaPixelActive ?? false);
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
          />
          <PixelField
            label="Google Analytics 4"
            placeholder="Ex: G-XXXXXXXXXX"
            value={ga4Id}
            active={ga4Active}
            onValueChange={setGa4Id}
            onActiveChange={setGa4Active}
          />
          <PixelField
            label="TikTok Pixel"
            placeholder="Ex: XXXXXXXXXXXXXXXXXXXXXXXX"
            value={tiktokId}
            active={tiktokActive}
            onValueChange={setTiktokId}
            onActiveChange={setTiktokActive}
          />

          <div
            className="p-3 rounded-xl mb-5 text-[12px] text-[var(--text-secondary)]"
            style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)' }}
          >
            <p className="font-semibold text-[var(--text-primary)] mb-1">Eventos rastreados automaticamente:</p>
            <p>• Visualização do formulário → <span className="font-mono text-[var(--accent)]">PageView</span></p>
            <p>• Início do formulário → <span className="font-mono text-[var(--accent)]">Lead</span></p>
            <p>• Envio completo → <span className="font-mono text-[var(--accent)]">CompleteRegistration</span></p>
          </div>

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
