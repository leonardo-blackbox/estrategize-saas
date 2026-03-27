import { IntegracaoMetaHeader } from '../IntegracaoMetaHeader';
import { IntegracaoMetaPixelId } from '../IntegracaoMetaPixelId';
import { IntegracaoMetaModeToggle } from '../IntegracaoMetaModeToggle';
import { IntegracaoMetaCapiFields } from '../IntegracaoMetaCapiFields';
import { IntegracaoMetaLeadEvent } from '../IntegracaoMetaLeadEvent';
import { IntegracaoMetaTrackedEvents } from '../IntegracaoMetaTrackedEvents';
import { IntegracaoMetaTestPanel } from '../IntegracaoMetaTestPanel';
import { IntegracaoSaveButton } from '../IntegracaoSaveButton';

interface IntegracaoMetaProps {
  metaOpen: boolean;
  onToggleOpen: () => void;
  metaPixelId: string;
  onPixelIdChange: (v: string) => void;
  metaPixelActive: boolean;
  onPixelActiveChange: (v: boolean) => void;
  metaMode: 'pixel' | 'capi';
  onModeChange: (v: 'pixel' | 'capi') => void;
  metaLeadEvent: 'start' | 'submit';
  onLeadEventChange: (v: 'start' | 'submit') => void;
  metaAccessToken: string;
  onAccessTokenChange: (v: string) => void;
  metaTestEventCode: string;
  onTestEventCodeChange: (v: string) => void;
  showToken: boolean;
  onToggleShowToken: () => void;
  isMetaConfigured: boolean;
  publicFormUrl: string | undefined;
  isSaving: boolean;
  isSaved: boolean;
  onSave: () => void;
}

export function IntegracaoMeta(props: IntegracaoMetaProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-hairline)' }}>
      <IntegracaoMetaHeader
        metaOpen={props.metaOpen}
        onToggleOpen={props.onToggleOpen}
        isMetaConfigured={props.isMetaConfigured}
        metaMode={props.metaMode}
        metaAccessToken={props.metaAccessToken}
      />
      {props.metaOpen && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: '1px solid var(--border-hairline)', background: 'var(--bg-base)' }}>
          <IntegracaoMetaPixelId pixelId={props.metaPixelId} onPixelIdChange={props.onPixelIdChange} active={props.metaPixelActive} onActiveChange={props.onPixelActiveChange} />
          <IntegracaoMetaModeToggle mode={props.metaMode} onModeChange={props.onModeChange} />
          {props.metaMode === 'capi' && (
            <IntegracaoMetaCapiFields
              accessToken={props.metaAccessToken} onAccessTokenChange={props.onAccessTokenChange}
              testEventCode={props.metaTestEventCode} onTestEventCodeChange={props.onTestEventCodeChange}
              showToken={props.showToken} onToggleShowToken={props.onToggleShowToken}
            />
          )}
          <IntegracaoMetaLeadEvent leadEvent={props.metaLeadEvent} onLeadEventChange={props.onLeadEventChange} />
          <IntegracaoMetaTrackedEvents leadEvent={props.metaLeadEvent} />
          {(props.metaPixelActive || props.metaPixelId) && (
            <IntegracaoMetaTestPanel pixelId={props.metaPixelId} publicUrl={props.publicFormUrl} />
          )}
          <IntegracaoSaveButton isSaving={props.isSaving} isSaved={props.isSaved} onSave={props.onSave} labelDefault="Salvar rastreamento" />
        </div>
      )}
    </div>
  );
}
