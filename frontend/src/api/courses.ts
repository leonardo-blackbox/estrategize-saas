import { client } from './client.ts';

export interface CourseAccess {
  allowed: boolean;
  reason: string;
  expiresAt?: string;
  unlocksAt?: string;
}

export interface LessonProgress {
  watched_secs: number;
  completed: boolean;
  last_watched: string;
}

export interface Attachment {
  id: string;
  title: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  sort_order: number;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  duration_secs?: number;
  sort_order: number;
  drip_days: number;
  is_free_preview: boolean;
  lesson_attachments: Attachment[];
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  sort_order: number;
  drip_days: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  status: string;
  sort_order: number;
  modules: Module[];
}

export interface CatalogCourse {
  id: string;
  title: string;
  description?: string;
  cover_url?: string;
  sort_order: number;
  total_lessons: number;
  access: CourseAccess;
}

export interface ContinueWatchingItem {
  watched_secs: number;
  last_watched: string;
  lessons: {
    id: string;
    title: string;
    duration_secs?: number;
    modules: {
      id: string;
      title: string;
      courses: { id: string; title: string; cover_url?: string };
    };
  };
}

// Catalog
export async function getCatalog(): Promise<CatalogCourse[]> {
  return client.get('/api/courses').json();
}

// Course detail
export async function getCourse(id: string): Promise<{
  course: Course;
  access: CourseAccess;
  progress: Record<string, LessonProgress>;
}> {
  return client.get(`/api/courses/${id}`).json();
}

// Lesson
export async function getLesson(lessonId: string): Promise<{
  lesson: Lesson & { modules: { id: string; title: string; courses: { id: string; title: string } } };
  progress: LessonProgress | null;
}> {
  return client.get(`/api/courses/lessons/${lessonId}`).json();
}

// Save progress
export async function saveProgress(
  lessonId: string,
  data: { watched_secs: number; completed?: boolean },
): Promise<LessonProgress> {
  return client.patch(`/api/courses/lessons/${lessonId}/progress`, { json: data }).json();
}

// Continue watching
export async function getContinueWatching(): Promise<ContinueWatchingItem[]> {
  return client.get('/api/courses/me/continue-watching').json();
}

// Admin
export async function adminGetCourses() {
  return client.get('/api/admin/courses').json();
}

export async function adminGetCourse(id: string) {
  return client.get(`/api/admin/courses/${id}`).json();
}

export async function adminCreateCourse(data: Partial<Course>) {
  return client.post('/api/admin/courses', { json: data }).json();
}

export async function adminUpdateCourse(id: string, data: Partial<Course>) {
  return client.put(`/api/admin/courses/${id}`, { json: data }).json();
}

export async function adminPublishCourse(id: string) {
  return client.post(`/api/admin/courses/${id}/publish`).json();
}

export async function adminArchiveCourse(id: string) {
  return client.post(`/api/admin/courses/${id}/archive`).json();
}

export async function adminCreateModule(courseId: string, data: Partial<Module>) {
  return client.post(`/api/admin/courses/${courseId}/modules`, { json: data }).json();
}

export async function adminCreateLesson(moduleId: string, data: Partial<Lesson>) {
  return client.post(`/api/admin/courses/modules/${moduleId}/lessons`, { json: data }).json();
}

export async function adminGetUsers(params?: { limit?: number; offset?: number; q?: string }) {
  const search = new URLSearchParams(params as any).toString();
  return client.get(`/api/admin/users${search ? `?${search}` : ''}`).json();
}

export async function adminGetUser(id: string) {
  return client.get(`/api/admin/users/${id}`).json();
}

export async function adminGrantEntitlement(userId: string, data: {
  course_id?: string;
  access: 'allow' | 'deny' | 'full_access';
  reason?: string;
  expires_at?: string | null;
}) {
  return client.post(`/api/admin/users/${userId}/entitlements`, { json: data }).json();
}

export async function adminRevokeEntitlement(userId: string, entitlementId: string) {
  return client.delete(`/api/admin/users/${userId}/entitlements/${entitlementId}`).json();
}

export async function adminGrantFullAccess(userId: string, courseId: string) {
  return client.post(`/api/admin/users/${userId}/grant-full-access/${courseId}`).json();
}

export async function adminGetWebhookEvents(params?: { limit?: number; offset?: number; status?: string; provider?: string }) {
  const search = new URLSearchParams(params as any).toString();
  return client.get(`/api/admin/users/webhooks/events${search ? `?${search}` : ''}`).json();
}

export async function adminGetAuditLogs(params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams(params as any).toString();
  return client.get(`/api/admin/users/audit${search ? `?${search}` : ''}`).json();
}

export async function adminGetStats() {
  return client.get('/api/admin/users/stats').json();
}

export async function adminGetEnrollments(params?: { limit?: number; offset?: number; course_id?: string }) {
  const search = new URLSearchParams(params as any).toString();
  return client.get(`/api/admin/users/enrollments${search ? `?${search}` : ''}`).json();
}
