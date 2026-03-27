import { useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchPublicForm, fetchPublicFormPreview, submitFormResponse, applicationKeys } from '../../../api/applications.ts';
import { useTrackingPixels, type TrackingConfig } from '../../../hooks/useTrackingPixels.ts';
import { useVisualViewport } from '../../../hooks/useVisualViewport.ts';
import type { ApplicationField, ThemeConfig, FormSettings } from '../types';
import { captureMetaClickData, DEFAULT_THEME, DEFAULT_SETTINGS } from '../utils/form-publico.helpers';
import { fireFormEvent } from '../services/form-publico.api';
import { useFormNavigation } from './useFormNavigation';
import { useFormEffects } from './useFormEffects';

export function useFormPublico() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const isEmbedMode = searchParams.get('embed') === '1';
  const isPreviewMode = searchParams.get('preview') === '1';
  const viewportHeight = useVisualViewport();
  const isTouchDevice = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionToken = useRef<string>(crypto.randomUUID());

  const { data, isLoading, isError } = useQuery({
    queryKey: [...applicationKeys.public(slug ?? ''), isPreviewMode ? 'preview' : 'public'],
    queryFn: () => isPreviewMode ? fetchPublicFormPreview(slug!) : fetchPublicForm(slug!),
    enabled: Boolean(slug),
    retry: 1,
  });

  const fields = data?.fields ?? [];
  const application = data?.application;
  const theme: ThemeConfig = application?.theme_config ?? DEFAULT_THEME;
  const settings: FormSettings = application?.settings ?? DEFAULT_SETTINGS;

  const tracking = (application?.settings as Record<string, unknown> | undefined)?.tracking as TrackingConfig | undefined;
  const { trackFormView, trackFormStart, trackFormSubmit } = useTrackingPixels(tracking);

  const collectibleFields = fields.filter((f: ApplicationField) => f.type !== 'welcome' && f.type !== 'message' && f.type !== 'thank_you');
  const answeredCount = collectibleFields.filter((f: ApplicationField) => {
    const v = answers[f.id]; return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;
  const progress = collectibleFields.length > 0 ? answeredCount / collectibleFields.length : 0;

  const lastQuestionableIndex = (() => {
    for (let i = fields.length - 1; i >= 0; i--) { if (fields[i].type !== 'welcome' && fields[i].type !== 'thank_you') return i; }
    return -1;
  })();

  const welcomeField = fields.find((f: ApplicationField) => f.type === 'welcome');
  const welcomeIndex = welcomeField ? fields.indexOf(welcomeField) : -1;

  const submitMutation = useMutation({
    mutationFn: ({ answersArr, metadata }: { answersArr: Array<{ field_id: string; value: unknown }>; metadata?: Record<string, string> }) =>
      submitFormResponse(slug!, answersArr, metadata),
    onSuccess: () => {
      trackFormSubmit(`${sessionToken.current}-submit`);
      setSubmitted(true);
      if (settings.redirectUrl) setRedirectCountdown(3);
      if (slug) {
        const { fbc, fbp } = captureMetaClickData(slug);
        fireFormEvent(slug, 'submit', sessionToken.current, { fbc, fbp });
      }
    },
  });

  const handleSubmit = useCallback((answersArr: Array<{ field_id: string; value: unknown }>, metadata: Record<string, string>) => {
    submitMutation.mutate({ answersArr, metadata });
  }, [submitMutation]);

  const nav = useFormNavigation({
    fields, answers, collectibleFields, lastQuestionableIndex, welcomeIndex,
    slug, sessionToken: sessionToken.current, trackFormStart, onSubmit: handleSubmit,
  });

  const collectibleIndex = nav.currentField
    ? collectibleFields.findIndex((f: ApplicationField) => f.id === nav.currentField!.id) : -1;
  const questionNumber = collectibleIndex + 1;

  const handleSetAnswer = useCallback((fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleReset = useCallback(() => {
    nav.setCurrentIndex(-1);
    nav.setDirection('forward');
    setAnswers({});
    setSubmitted(false);
  }, [nav]);

  useFormEffects({
    submitted, currentField: nav.currentField, handleNext: nav.handleNext, setAnswers,
    data, slug, sessionToken: sessionToken.current, trackFormView, trackFormStart,
    isLoading, welcomeField, currentIndex: nav.currentIndex, fields,
    setCurrentIndex: nav.setCurrentIndex, redirectCountdown,
    redirectUrl: settings.redirectUrl, setRedirectCountdown,
  });

  return {
    slug, isEmbedMode, isPreviewMode, viewportHeight, isTouchDevice,
    isLoading, isError, data, application, fields, theme, settings,
    currentIndex: nav.currentIndex, currentField: nav.currentField,
    answers, submitted, direction: nav.direction,
    validationError: nav.validationError, redirectCountdown, containerRef,
    collectibleFields, progress, questionNumber, isLastQuestion: nav.isLastQuestion,
    welcomeField, submitMutation,
    handleSetAnswer, handleNext: nav.handleNext, handleBack: nav.handleBack,
    handleReset, handleWelcomeStart: nav.handleWelcomeStart,
    setValidationError: nav.setValidationError,
  };
}
