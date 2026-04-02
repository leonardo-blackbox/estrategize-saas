import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateApplication,
  deleteApplication,
  applicationKeys,
  type ThemeConfig,
  type FormSettings,
} from '../../../../api/applications.ts';
import type { ApplicationShellContext } from '../../hooks/useApplicationShell.ts';
import { OptionsSaveBar } from '../OptionsSaveBar/index.ts';
import { OptionsGeneralSection } from '../OptionsGeneralSection/index.ts';
import { OptionsFormSettings } from '../OptionsFormSettings/index.ts';
import { OptionsThankYouSection } from '../OptionsThankYouSection/index.ts';
import { OptionsDangerZone } from '../OptionsDangerZone/index.ts';

export function OpcoesContent() {
  const { application, isLoading, refetch } = useOutletContext<ApplicationShellContext>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [settings, setSettings] = useState<Partial<FormSettings>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Sync form state when server data arrives/changes (intentional external-to-local sync)
  useEffect(() => {
    if (application) {
      setTitle(application.title); // eslint-disable-line react-hooks/set-state-in-effect
      setSettings({ ...application.settings });
      setIsDirty(false);
    }
  }, [application]);

  function updateSettings(updates: Partial<FormSettings>) {
    setSettings((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateApplication(application!.id, {
        title: title.trim() || application!.title,
        theme_config: application!.theme_config as ThemeConfig,
        settings: settings as FormSettings,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.detail(application!.id) });
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      setIsDirty(false);
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteApplication(application!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      navigate('/aplicacoes');
    },
  });

  if (isLoading || !application) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="inline-block w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function handleDiscard() {
    if (application) {
      setTitle(application.title);
      setSettings({ ...application.settings });
      setIsDirty(false);
    }
  }

  function handleTitleChange(v: string) {
    setTitle(v);
    setIsDirty(true);
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {isDirty && (
          <OptionsSaveBar
            isSaving={saveMutation.isPending}
            onDiscard={handleDiscard}
            onSave={() => saveMutation.mutate()}
          />
        )}

        <div style={{ height: 1, background: 'var(--border-hairline)', marginBottom: 24 }} />

        <OptionsGeneralSection title={title} onTitleChange={handleTitleChange} />

        <div style={{ height: 1, background: 'var(--border-hairline)' }} />

        <OptionsFormSettings settings={settings} onUpdate={updateSettings} />

        <div style={{ height: 1, background: 'var(--border-hairline)' }} />

        <OptionsThankYouSection settings={settings} onUpdate={updateSettings} />

        <div style={{ height: 1, background: 'var(--border-hairline)' }} />

        <OptionsDangerZone
          isDeleting={deleteMutation.isPending}
          onDelete={() => deleteMutation.mutate()}
        />
      </div>
    </div>
  );
}
