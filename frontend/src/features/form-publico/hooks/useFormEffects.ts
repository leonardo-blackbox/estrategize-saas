import { useEffect } from 'react';
import type { ApplicationField } from '../types';
import { LETTER_KEYS, getFieldOptions, getOptionFromOptions, captureMetaClickData } from '../utils/form-publico.helpers';
import { fireFormEvent } from '../services/form-publico.api';

interface UseFormEffectsParams {
  submitted: boolean;
  currentField: ApplicationField | null;
  handleNext: () => void;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  data: unknown;
  slug: string | undefined;
  sessionToken: string;
  trackFormView: (eventId: string) => void;
  trackFormStart: (eventId: string) => void;
  isLoading: boolean;
  welcomeField: ApplicationField | undefined;
  currentIndex: number;
  fields: ApplicationField[];
  setCurrentIndex: (idx: number) => void;
  redirectCountdown: number | null;
  redirectUrl: string | undefined;
  setRedirectCountdown: React.Dispatch<React.SetStateAction<number | null>>;
}

export function useFormEffects(params: UseFormEffectsParams) {
  const {
    submitted, currentField, handleNext, setAnswers,
    data, slug, sessionToken, trackFormView, trackFormStart,
    isLoading, welcomeField, currentIndex, fields, setCurrentIndex,
    redirectCountdown, redirectUrl, setRedirectCountdown,
  } = params;

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (submitted) return;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === 'Enter') {
        if (isInput && target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handleNext();
        return;
      }
      if (currentField?.type === 'multiple_choice' && !isInput) {
        const idx = LETTER_KEYS.indexOf(e.key.toLowerCase());
        if (idx >= 0) {
          const options = getFieldOptions(currentField);
          const option = options[idx];
          if (!option) return;
          const allowMultiple = (getOptionFromOptions(currentField, 'allowMultiple') as boolean) || false;
          setAnswers((prev) => {
            const current = (prev[currentField.id] as string[]) ?? [];
            if (allowMultiple) {
              const newVal = current.includes(option.id) ? current.filter((v) => v !== option.id) : [...current, option.id];
              return { ...prev, [currentField.id]: newVal };
            } else {
              const newVal = current.includes(option.id) ? [] : [option.id];
              return { ...prev, [currentField.id]: newVal };
            }
          });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [submitted, currentField, handleNext, setAnswers]);

  // Track view
  useEffect(() => {
    if (data && slug) {
      trackFormView(`${sessionToken}-view`);
      const { fbc, fbp } = captureMetaClickData(slug);
      fireFormEvent(slug, 'view', sessionToken, { fbc, fbp });
    }
  }, [data, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect countdown
  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) { window.location.href = redirectUrl!; return; }
    const timer = setTimeout(() => setRedirectCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, redirectUrl, setRedirectCountdown]);

  // Auto-start if no welcome field
  useEffect(() => {
    if (!isLoading && data && !welcomeField && currentIndex === -1) {
      const first = fields.findIndex((f) => f.type !== 'welcome' && f.type !== 'thank_you');
      if (first >= 0) {
        trackFormStart(`${sessionToken}-start`);
        if (slug) fireFormEvent(slug, 'start', sessionToken, captureMetaClickData(slug));
        setCurrentIndex(first);
      }
    }
  }, [isLoading, data, welcomeField, currentIndex, fields]); // eslint-disable-line react-hooks/exhaustive-deps
}
