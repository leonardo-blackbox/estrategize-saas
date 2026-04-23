import { client } from '../../../api/client.ts';
import type { ApplicationField } from '../../../api/applications.ts';
import type { Quiz, QuizOutcome } from '../../quiz/services/quiz.api.ts';

export interface PublicQuizData { application: Quiz; fields: ApplicationField[]; outcomes: QuizOutcome[]; isPreview?: boolean; }
export interface QuizAnswer { field_id: string; field_type: string; field_title: string; value: unknown; }
export interface QuizSubmitResult { responseId: string; score: number; outcome: QuizOutcome | null; }

export async function fetchPublicQuiz(slug: string, preview: boolean): Promise<PublicQuizData> {
  const path = preview ? `/api/public/quizzes/${slug}/preview` : `/api/public/quizzes/${slug}`;
  const res = await client.get(path).json<{ data: PublicQuizData }>();
  return res.data;
}

export async function submitQuiz(slug: string, answers: QuizAnswer[], metadata: Record<string, unknown>) {
  const res = await client.post(`/api/public/quizzes/${slug}/responses`, { json: { answers, metadata } }).json<{ data: QuizSubmitResult }>();
  return res.data;
}

export async function trackQuiz(slug: string, eventType: 'view' | 'start' | 'submit', metadata: Record<string, unknown>) {
  await client.post(`/api/public/quizzes/${slug}/events`, { json: { event_type: eventType, ...metadata } }).json<{ ok: boolean }>();
}

export async function fireLeadEvent(slug: string, answers: QuizAnswer[], metadata: Record<string, unknown>) {
  await client.post(`/api/public/quizzes/${slug}/lead-event`, { json: { answers, ...metadata } }).json<{ ok: boolean }>();
}
