import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateTrackingConfig, updateNotificationConfig, applicationKeys,
  type TrackingConfig, type NotificationConfig,
} from '../../../api/applications.ts';

interface Application { id: string; slug?: string; settings?: Record<string, unknown> }

export function useIntegracao(application: Application | null) {
  const queryClient = useQueryClient();
  const existingSettings = application?.settings as Record<string, unknown> | undefined;
  const existingTracking = existingSettings?.tracking as TrackingConfig | undefined;
  const existingNotifs = existingSettings?.notifications as NotificationConfig | undefined;

  const [metaOpen, setMetaOpen] = useState(!!(existingTracking?.metaPixelId || existingTracking?.metaPixelActive));
  const [metaPixelId, setMetaPixelId] = useState(existingTracking?.metaPixelId || '');
  const [metaPixelActive, setMetaPixelActive] = useState(existingTracking?.metaPixelActive ?? false);
  const [metaMode, setMetaMode] = useState<'pixel' | 'capi'>(existingTracking?.metaAccessToken ? 'capi' : 'pixel');
  const [metaLeadEvent, setMetaLeadEvent] = useState<'start' | 'submit'>(existingTracking?.metaLeadEvent ?? 'submit');
  const [metaAccessToken, setMetaAccessToken] = useState(existingTracking?.metaAccessToken || '');
  const [metaTestEventCode, setMetaTestEventCode] = useState(existingTracking?.metaTestEventCode || '');
  const [showToken, setShowToken] = useState(false);
  const [ga4Id, setGa4Id] = useState(existingTracking?.ga4MeasurementId || '');
  const [ga4Active, setGa4Active] = useState(existingTracking?.ga4Active ?? false);
  const [tiktokId, setTiktokId] = useState(existingTracking?.tiktokPixelId || '');
  const [tiktokActive, setTiktokActive] = useState(existingTracking?.tiktokPixelActive ?? false);
  const [emailEnabled, setEmailEnabled] = useState(existingNotifs?.emailEnabled ?? false);
  const [emailTo, setEmailTo] = useState(existingNotifs?.emailTo || '');
  const [emailCc, setEmailCc] = useState(existingNotifs?.emailCc || '');
  const [trackingSaved, setTrackingSaved] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    if (existingTracking) {
      setMetaOpen(!!(existingTracking.metaPixelId || existingTracking.metaPixelActive));
      setMetaPixelId(existingTracking.metaPixelId || '');
      setMetaPixelActive(existingTracking.metaPixelActive ?? false);
      setMetaMode(existingTracking.metaAccessToken ? 'capi' : 'pixel');
      setMetaLeadEvent(existingTracking.metaLeadEvent ?? 'submit');
      setMetaAccessToken(existingTracking.metaAccessToken || '');
      setMetaTestEventCode(existingTracking.metaTestEventCode || '');
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
      metaPixelId: metaPixelId.trim() || undefined, metaPixelActive, metaMode, metaLeadEvent,
      metaAccessToken: metaMode === 'capi' ? (metaAccessToken.trim() || undefined) : undefined,
      metaTestEventCode: metaMode === 'capi' ? (metaTestEventCode.trim() || undefined) : undefined,
      ga4MeasurementId: ga4Id.trim() || undefined, ga4Active,
      tiktokPixelId: tiktokId.trim() || undefined, tiktokPixelActive: tiktokActive,
    });
  }

  function handleSaveNotifs() {
    if (!application) return;
    notifMutation.mutate({
      emailEnabled, emailTo: emailTo.trim() || undefined,
      emailCc: emailCc.trim() || undefined, digestMode: 'instant',
    });
  }

  const isMetaConfigured = !!(metaPixelId && metaPixelActive);
  const publicFormUrl = application?.slug ? `${window.location.origin}/f/${application.slug}` : undefined;

  return {
    metaOpen, setMetaOpen, metaPixelId, setMetaPixelId,
    metaPixelActive, setMetaPixelActive, metaMode, setMetaMode,
    metaLeadEvent, setMetaLeadEvent, metaAccessToken, setMetaAccessToken,
    metaTestEventCode, setMetaTestEventCode, showToken, setShowToken, isMetaConfigured,
    ga4Id, setGa4Id, ga4Active, setGa4Active,
    tiktokId, setTiktokId, tiktokActive, setTiktokActive,
    emailEnabled, setEmailEnabled, emailTo, setEmailTo, emailCc, setEmailCc,
    trackingMutation, notifMutation, trackingSaved, notifSaved,
    handleSaveTracking, handleSaveNotifs, publicFormUrl,
  };
}
