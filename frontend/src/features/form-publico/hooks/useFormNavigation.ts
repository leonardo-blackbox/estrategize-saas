import { useCallback, useState } from 'react';
import type { ApplicationField, Direction } from '../types';
import { getFieldOptions, captureUTM, captureMetaClickData } from '../utils/form-publico.helpers';
import { fireFormEvent } from '../services/form-publico.api';

interface UseFormNavigationParams {
  fields: ApplicationField[];
  answers: Record<string, unknown>;
  collectibleFields: ApplicationField[];
  lastQuestionableIndex: number;
  welcomeIndex: number;
  slug: string | undefined;
  sessionToken: string;
  trackFormStart: (eventId: string) => void;
  onSubmit: (answersArr: Array<{ field_id: string; value: unknown }>, metadata: Record<string, string>) => void;
}

export function useFormNavigation(params: UseFormNavigationParams) {
  const { fields, answers, collectibleFields, lastQuestionableIndex, welcomeIndex, slug, sessionToken, trackFormStart, onSubmit } = params;

  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [direction, setDirection] = useState<Direction>('forward');
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentField = fields[currentIndex] ?? null;
  const isLastQuestion = currentIndex === lastQuestionableIndex;

  const handleNext = useCallback(() => {
    if (!currentField) {
      const firstIdx = fields.findIndex((f) => f.type !== 'welcome');
      trackFormStart(`${sessionToken}-start`);
      if (slug) fireFormEvent(slug, 'start', sessionToken, captureMetaClickData(slug));
      setDirection('forward');
      setCurrentIndex(firstIdx >= 0 ? firstIdx : 0);
      return;
    }
    if (currentField.required && currentField.type !== 'message' && currentField.type !== 'welcome') {
      const v = answers[currentField.id];
      const hasValue = Array.isArray(v) ? v.length > 0 : Boolean(v);
      if (!hasValue) { setValidationError('Este campo é obrigatório'); return; }
    }
    setValidationError(null);
    if (isLastQuestion) {
      const answersArr = collectibleFields
        .filter((f) => answers[f.id] !== undefined)
        .map((f) => {
          let value = answers[f.id];
          if (f.type === 'multiple_choice' && Array.isArray(value)) {
            const opts = getFieldOptions(f);
            value = (value as string[]).map((id) => opts.find((o) => o.id === id)?.label ?? id);
          }
          return { field_id: f.id, field_type: f.type, field_title: f.title, value };
        });
      const utm = captureUTM(slug!);
      const { fbc, fbp, fbclid } = captureMetaClickData(slug!);
      const metadata: Record<string, string> = {};
      Object.entries(utm).forEach(([k, v]) => { metadata[k] = v; });
      if (fbc) metadata.fbc = fbc;
      if (fbp) metadata.fbp = fbp;
      if (fbclid) metadata.fbclid = fbclid;
      metadata.event_id = `${sessionToken}-submit`;
      metadata.page_url = window.location.href;
      onSubmit(answersArr, metadata);
      return;
    }
    setDirection('forward');
    setCurrentIndex((prev) => Math.min(prev + 1, fields.length - 1));
  }, [currentField, fields, answers, isLastQuestion, collectibleFields, slug, sessionToken, trackFormStart, onSubmit]);

  const handleBack = useCallback(() => {
    if (currentIndex <= 0) return;
    setDirection('back');
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, [currentIndex]);

  const handleWelcomeStart = useCallback(() => {
    setDirection('forward');
    trackFormStart(`${sessionToken}-start`);
    if (slug) fireFormEvent(slug, 'start', sessionToken, captureMetaClickData(slug));
    const firstNonWelcome = fields.findIndex((f, i) => i > welcomeIndex && f.type !== 'welcome');
    setCurrentIndex(firstNonWelcome >= 0 ? firstNonWelcome : 0);
  }, [fields, welcomeIndex, slug, sessionToken, trackFormStart]);

  return {
    currentIndex, setCurrentIndex, direction, setDirection,
    validationError, setValidationError,
    currentField, isLastQuestion,
    handleNext, handleBack, handleWelcomeStart,
  };
}
