import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicQuiz, fireLeadEvent, trackQuiz, type QuizAnswer } from '../services/quiz-publico.api.ts';
import { useQuizSubmit } from './useQuizSubmit.ts';

export type QuizState = 'loading' | 'welcome' | 'questions' | 'submitting' | 'score_reveal' | 'result' | 'error';

export function useQuizPublico(slug: string, preview: boolean) {
  const sessionToken = useMemo(() => crypto.randomUUID(), []);
  const metadata = useMemo(() => ({ session_token: sessionToken, page_url: window.location.href, timestamp: new Date().toISOString(), user_agent: navigator.userAgent }), [sessionToken]);
  const [state, setState] = useState<QuizState>('loading');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [leadSent, setLeadSent] = useState(false);
  const query = useQuery({ queryKey: ['public-quiz', slug, preview], queryFn: () => fetchPublicQuiz(slug, preview), retry: false });
  const submitMutation = useQuizSubmit(slug);
  const questionFields = (query.data?.fields ?? []).filter((field) => !['welcome', 'thank_you'].includes(field.type));

  useEffect(() => {
    if (!query.data) return undefined;
    const id = window.setTimeout(() => setState('welcome'), 0);
    trackQuiz(slug, 'view', metadata).catch(() => undefined);
    return () => window.clearTimeout(id);
  }, [metadata, query.data, slug]);
  useEffect(() => {
    if (!query.error) return undefined;
    const id = window.setTimeout(() => setState('error'), 0);
    return () => window.clearTimeout(id);
  }, [query.error]);

  const start = () => { setState('questions'); trackQuiz(slug, 'start', metadata).catch(() => undefined); };
  const answerCurrent = (value: unknown) => {
    const field = questionFields[index];
    if (!field) return;
    const next = [...answers.filter((answer) => answer.field_id !== field.id), { field_id: field.id, field_type: field.type, field_title: field.title, value }];
    setAnswers(next);
  };
  const next = () => {
    const field = questionFields[index];
    const trigger = Boolean((field?.options as { triggerLeadEvent?: boolean } | undefined)?.triggerLeadEvent);
    if (trigger && !leadSent) { fireLeadEvent(slug, answers, metadata).catch(() => undefined); setLeadSent(true); }
    if (index < questionFields.length - 1) setIndex(index + 1);
    else { setState('submitting'); submitMutation.mutate({ answers, metadata }, { onSuccess: () => { trackQuiz(slug, 'submit', metadata).catch(() => undefined); setState('score_reveal'); }, onError: () => setState('error') }); }
  };
  const prev = () => setIndex((current) => Math.max(0, current - 1));

  return { ...query, state, setState, quiz: query.data, fields: questionFields, index, answers, currentAnswer: answers.find((answer) => answer.field_id === questionFields[index]?.id), start, answerCurrent, next, prev, submitResult: submitMutation.data };
}
