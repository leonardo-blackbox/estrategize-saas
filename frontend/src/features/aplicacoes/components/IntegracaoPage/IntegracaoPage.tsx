import { useOutletContext } from 'react-router-dom';
import type { ApplicationShellContext } from '../../../../pages/member/aplicacoes/ApplicationShell.tsx';
import { useIntegracao } from '../../hooks/useIntegracao';
import { IntegracaoMeta } from '../IntegracaoMeta';
import { IntegracaoPixelField } from '../IntegracaoPixelField';
import { IntegracaoNotificacoes } from '../IntegracaoNotificacoes';

export function IntegracaoPage() {
  const { application } = useOutletContext<ApplicationShellContext>();
  const h = useIntegracao((application ?? null) as Parameters<typeof useIntegracao>[0]);

  if (!application) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-xl mx-auto px-6 py-8 space-y-3">
        <IntegracaoMeta
          metaOpen={h.metaOpen}
          onToggleOpen={() => h.setMetaOpen((v) => !v)}
          metaPixelId={h.metaPixelId}
          onPixelIdChange={h.setMetaPixelId}
          metaPixelActive={h.metaPixelActive}
          onPixelActiveChange={h.setMetaPixelActive}
          metaMode={h.metaMode}
          onModeChange={h.setMetaMode}
          metaLeadEvent={h.metaLeadEvent}
          onLeadEventChange={h.setMetaLeadEvent}
          metaAccessToken={h.metaAccessToken}
          onAccessTokenChange={h.setMetaAccessToken}
          metaTestEventCode={h.metaTestEventCode}
          onTestEventCodeChange={h.setMetaTestEventCode}
          showToken={h.showToken}
          onToggleShowToken={() => h.setShowToken((v) => !v)}
          isMetaConfigured={h.isMetaConfigured}
          publicFormUrl={h.publicFormUrl}
          isSaving={h.trackingMutation.isPending}
          isSaved={h.trackingSaved}
          onSave={h.handleSaveTracking}
        />

        <IntegracaoPixelField
          label="Google Analytics 4"
          placeholder="Ex: G-XXXXXXXXXX"
          value={h.ga4Id}
          active={h.ga4Active}
          onValueChange={h.setGa4Id}
          onActiveChange={h.setGa4Active}
          tooltip="Encontre o ID no Google Analytics → Administrador → Fluxos de dados → selecione seu site. O ID começa com G- (ex: G-AB12CD34EF)."
        />

        <IntegracaoPixelField
          label="TikTok Pixel"
          placeholder="Ex: XXXXXXXXXXXXXXXXXXXXXXXX"
          value={h.tiktokId}
          active={h.tiktokActive}
          onValueChange={h.setTiktokId}
          onActiveChange={h.setTiktokActive}
          tooltip="Encontre o ID no TikTok Ads Manager → Ativos → Eventos → Web Events → selecione seu pixel → Configurações. O ID é alfanumérico."
        />

        <div style={{ height: 1, background: 'var(--border-hairline)', margin: '20px 0' }} />

        <IntegracaoNotificacoes
          emailEnabled={h.emailEnabled}
          onEmailEnabledChange={h.setEmailEnabled}
          emailTo={h.emailTo}
          onEmailToChange={h.setEmailTo}
          emailCc={h.emailCc}
          onEmailCcChange={h.setEmailCc}
          isSaving={h.notifMutation.isPending}
          isSaved={h.notifSaved}
          onSave={h.handleSaveNotifs}
        />
      </div>
    </div>
  );
}
