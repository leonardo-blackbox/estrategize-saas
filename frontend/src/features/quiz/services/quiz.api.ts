import { client } from '../../../api/client.ts';
import type { Application, ApplicationField, ResponseWithAnswers } from '../../../api/applications.ts';

export type Quiz = Application & { tool_type?: 'quiz'; quiz_config?: Record<string, unknown> | null };
export type QuizUpdate = Partial<Pick<Quiz, 'title' | 'status' | 'theme_config' | 'settings' | 'quiz_config'>>;
export interface QuizOutcome {
  id?: string;
  application_id?: string;
  outcome_key: string;
  title: string;
  description?: string | null;
  score_min: number;
  score_max: number;
  cta_type: 'url' | 'whatsapp' | 'none';
  cta_url?: string | null;
  cta_label?: string | null;
  image_url?: string | null;
  background_color?: string | null;
  order?: number;
  pixel_event_name?: string | null;
  created_at?: string;
}

const quizKeysRoot = ['quizzes'] as const;
export const quizKeys = {
  all: quizKeysRoot,
  lists: () => [...quizKeysRoot, 'list'] as const,
  detail: (id: string) => [...quizKeysRoot, 'detail', id] as const,
  outcomes: (id: string) => [...quizKeysRoot, 'outcomes', id] as const,
  responses: (id: string) => [...quizKeysRoot, 'responses', id] as const,
};

export async function listQuizzes(): Promise<Quiz[]> {
  const res = await client.get('/api/quizzes').json<{ data: Quiz[] }>();
  return res.data;
}

export async function createQuiz(title: string): Promise<Quiz> {
  const res = await client.post('/api/quizzes', { json: { title } }).json<{ data: Quiz }>();
  return res.data;
}

export async function fetchQuiz(id: string): Promise<Quiz> {
  const res = await client.get(`/api/quizzes/${id}`).json<{ data: Quiz }>();
  return res.data;
}

export async function updateQuiz(id: string, updates: QuizUpdate): Promise<Quiz> {
  const res = await client.put(`/api/quizzes/${id}`, { json: updates }).json<{ data: Quiz }>();
  return res.data;
}

export async function deleteQuiz(id: string): Promise<void> {
  await client.delete(`/api/quizzes/${id}`).json<void>();
}

export async function duplicateQuiz(id: string): Promise<Quiz> {
  const res = await client.post(`/api/quizzes/${id}/duplicate`).json<{ data: Quiz }>();
  return res.data;
}

export async function archiveQuiz(id: string) { return updateQuiz(id, { status: 'archived' }); }
export async function publishQuiz(id: string) { return updateQuiz(id, { status: 'published' }); }
export async function unpublishQuiz(id: string) { return updateQuiz(id, { status: 'draft' }); }

export async function updateQuizFields(id: string, fields: Partial<ApplicationField>[]) {
  const res = await client.put(`/api/quizzes/${id}/fields`, { json: { fields } }).json<{ data: ApplicationField[] }>();
  return res.data;
}

export async function listQuizOutcomes(id: string): Promise<QuizOutcome[]> {
  const res = await client.get(`/api/quizzes/${id}/outcomes`).json<{ data: QuizOutcome[] }>();
  return res.data;
}

export async function saveQuizOutcomes(id: string, outcomes: QuizOutcome[]) {
  const res = await client.put(`/api/quizzes/${id}/outcomes`, { json: { outcomes } }).json<{ data: QuizOutcome[] }>();
  return res.data;
}

export async function listQuizResponses(id: string): Promise<ResponseWithAnswers[]> {
  const res = await client.get(`/api/quizzes/${id}/responses`).json<{ data: { responses: ResponseWithAnswers[] } }>();
  return res.data.responses;
}
