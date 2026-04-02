import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { ApplicationShellContext } from '../../hooks/useApplicationShell.ts';
import { ShareLinkSection } from '../ShareLinkSection/index.ts';
import { EmbedSection } from '../EmbedSection/index.ts';
import { QrCodeSection } from '../QrCodeSection/index.ts';
import { EmbedPreviewPanel } from '../EmbedPreviewPanel/index.ts';

export function CompartilharContent() {
  const { application, isLoading } = useOutletContext<ApplicationShellContext>();
  const [embedHeight, setEmbedHeight] = useState(600);

  const publicUrl = application ? `${window.location.origin}/f/${application.slug}` : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="inline-block w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
      {/* Left panel */}
      <div
        className="w-full md:w-[340px] md:flex-shrink-0 overflow-y-auto border-b md:border-b-0 md:border-r border-[var(--border-hairline)]"
        style={{ background: 'var(--bg-surface-1)' }}
      >
        <div className="p-6 space-y-8">
          <ShareLinkSection
            publicUrl={publicUrl}
            applicationTitle={application?.title ?? ''}
          />

          <div style={{ height: 1, background: 'var(--border-hairline)' }} />

          <EmbedSection
            slug={application?.slug ?? ''}
            embedHeight={embedHeight}
            onEmbedHeightChange={setEmbedHeight}
          />

          <div style={{ height: 1, background: 'var(--border-hairline)' }} />

          <QrCodeSection
            publicUrl={publicUrl}
            slug={application?.slug ?? ''}
          />
        </div>
      </div>

      {/* Right panel - preview */}
      <EmbedPreviewPanel embedHeight={embedHeight} />
    </div>
  );
}
