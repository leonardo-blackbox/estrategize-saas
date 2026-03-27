import { useState } from 'react';
import { useEditorStore } from '../../../../stores/editorStore.ts';
import { LogoUploadSection } from './LogoUploadSection.tsx';
import { BgUploadSection } from './BgUploadSection.tsx';
import { ColorsSection } from './ColorsSection.tsx';
import { FontSection } from './FontSection.tsx';
import { BorderRadiusSection } from './BorderRadiusSection.tsx';

export function FieldOptionsAppearance() {
  const { themeConfig, updateTheme, applicationId } = useEditorStore();
  const [logoUploading, setLogoUploading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !applicationId) return;
    if (file.size > 2 * 1024 * 1024) { alert('Arquivo muito grande (max 2MB)'); return; }
    setLogoUploading(true);
    try {
      const { uploadApplicationAsset } = await import('../../../../api/applications.ts');
      const { url } = await uploadApplicationAsset(applicationId, 'logo', file);
      updateTheme({ logoUrl: url });
    } catch (err) { console.error(err); alert('Erro ao fazer upload da logo'); }
    finally { setLogoUploading(false); }
  }

  async function handleRemoveLogo() {
    if (!applicationId) return;
    try {
      const { deleteApplicationAsset } = await import('../../../../api/applications.ts');
      await deleteApplicationAsset(applicationId, 'logo');
      updateTheme({ logoUrl: undefined });
    } catch (err) { console.error(err); }
  }

  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !applicationId) return;
    if (file.size > 5 * 1024 * 1024) { alert('Arquivo muito grande (max 5MB)'); return; }
    setBgUploading(true);
    try {
      const { uploadApplicationAsset } = await import('../../../../api/applications.ts');
      const { url } = await uploadApplicationAsset(applicationId, 'background', file);
      updateTheme({ backgroundImageUrl: url });
    } catch (err) { console.error(err); alert('Erro ao fazer upload do fundo'); }
    finally { setBgUploading(false); }
  }

  async function handleRemoveBg() {
    if (!applicationId) return;
    try {
      const { deleteApplicationAsset } = await import('../../../../api/applications.ts');
      await deleteApplicationAsset(applicationId, 'background');
      updateTheme({ backgroundImageUrl: undefined, backgroundOverlayOpacity: undefined });
    } catch (err) { console.error(err); }
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <LogoUploadSection
        logoUrl={themeConfig.logoUrl}
        uploading={logoUploading}
        onUpload={handleLogoUpload}
        onRemove={handleRemoveLogo}
      />
      <BgUploadSection
        bgUrl={themeConfig.backgroundImageUrl}
        overlayOpacity={themeConfig.backgroundOverlayOpacity}
        uploading={bgUploading}
        onUpload={handleBgUpload}
        onRemove={handleRemoveBg}
        onOverlayChange={(v) => updateTheme({ backgroundOverlayOpacity: v })}
      />
      <ColorsSection />
      <FontSection />
      <BorderRadiusSection />
    </div>
  );
}
