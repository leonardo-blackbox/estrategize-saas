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

export interface LessonLink {
  id: string;
  lesson_id: string;
  type: 'link' | 'button';
  label: string;
  url: string;
  sort_order: number;
}

export interface LessonComment {
  id: string;
  lesson_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  user: { email: string; avatar_url?: string };
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
  lesson_links?: LessonLink[];
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
  banner_url?: string;
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
  sales_url?: string | null;
  offer_badge_enabled?: boolean;
  offer_badge_text?: string | null;
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
  lesson: Lesson & { modules: { id: string; title: string; sort_order: number; courses: { id: string; title: string } } };
  progress: LessonProgress | null;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  isLast: boolean;
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

export async function adminUpdateModule(id: string, data: Partial<Module>) {
  return client.put(`/api/admin/courses/modules/${id}`, { json: data }).json();
}

export async function adminDeleteModule(id: string) {
  return client.delete(`/api/admin/courses/modules/${id}`).json();
}

export async function adminUpdateLesson(id: string, data: Partial<Lesson>) {
  return client.put(`/api/admin/courses/lessons/${id}`, { json: data }).json();
}

export async function adminDeleteLesson(id: string) {
  return client.delete(`/api/admin/courses/lessons/${id}`).json();
}

export async function adminCreateLessonLink(lessonId: string, data: Partial<LessonLink>) {
  return client.post(`/api/admin/courses/lessons/${lessonId}/links`, { json: data }).json();
}

export async function adminUpdateLessonLink(linkId: string, data: Partial<LessonLink>) {
  return client.put(`/api/admin/courses/lessons/links/${linkId}`, { json: data }).json();
}

export async function adminDeleteLessonLink(linkId: string) {
  return client.delete(`/api/admin/courses/lessons/links/${linkId}`).json();
}

export async function getLessonComments(lessonId: string, offset = 0): Promise<{ comments: LessonComment[]; hasMore: boolean }> {
  return client.get(`/api/courses/lessons/${lessonId}/comments?offset=${offset}`).json();
}

export async function createLessonComment(lessonId: string, data: { content: string; parent_id?: string | null }) {
  return client.post(`/api/courses/lessons/${lessonId}/comments`, { json: data }).json();
}

export async function deleteLessonComment(commentId: string) {
  return client.delete(`/api/courses/lessons/comments/${commentId}`).json();
}

export async function adminGetUsers(params?: { limit?: number; offset?: number; q?: string }) {
  const clean: Record<string, string> = {};
  if (params?.limit != null) clean.limit = String(params.limit);
  if (params?.offset != null) clean.offset = String(params.offset);
  if (params?.q) clean.q = params.q;
  const search = new URLSearchParams(clean).toString();
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
  const clean: Record<string, string> = {};
  if (params?.limit != null) clean.limit = String(params.limit);
  if (params?.offset != null) clean.offset = String(params.offset);
  if (params?.status) clean.status = params.status;
  if (params?.provider) clean.provider = params.provider;
  const search = new URLSearchParams(clean).toString();
  return client.get(`/api/admin/users/webhooks/events${search ? `?${search}` : ''}`).json();
}

export async function adminGetAuditLogs(params?: { limit?: number; offset?: number }) {
  const clean: Record<string, string> = {};
  if (params?.limit != null) clean.limit = String(params.limit);
  if (params?.offset != null) clean.offset = String(params.offset);
  const search = new URLSearchParams(clean).toString();
  return client.get(`/api/admin/users/audit${search ? `?${search}` : ''}`).json();
}

export async function adminGetStats() {
  return client.get('/api/admin/users/stats').json();
}

export async function adminGetEnrollments(params?: { limit?: number; offset?: number; course_id?: string }) {
  const clean: Record<string, string> = {};
  if (params?.limit != null) clean.limit = String(params.limit);
  if (params?.offset != null) clean.offset = String(params.offset);
  if (params?.course_id) clean.course_id = params.course_id;
  const search = new URLSearchParams(clean).toString();
  return client.get(`/api/admin/users/enrollments${search ? `?${search}` : ''}`).json();
}

// ─── Admin User Detail ──────────────────────────────────────────

export async function adminGetUserCreditTransactions(
  id: string,
  params?: { limit?: number; offset?: number },
) {
  const clean: Record<string, string> = {};
  if (params?.limit != null) clean.limit = String(params.limit);
  if (params?.offset != null) clean.offset = String(params.offset);
  const search = new URLSearchParams(clean).toString();
  return client.get(`/api/admin/users/${id}/credit-transactions${search ? `?${search}` : ''}`).json();
}

export async function adminAdjustCredits(
  id: string,
  data: { amount: number; description: string },
) {
  return client.post(`/api/admin/users/${id}/credits`, { json: data }).json();
}

export async function adminUpdateUserProfile(
  id: string,
  data: { role?: 'member' | 'admin'; full_name?: string },
) {
  return client.patch(`/api/admin/users/${id}`, { json: data }).json();
}

// ─── Formation Sections (member) ───────────────────────────────

export interface FormationSection {
  id: string;
  title: string;
  sort_order: number;
  courses: CatalogCourse[];
}

export async function getFormacaoSections(): Promise<FormationSection[]> {
  return client.get('/api/courses/sections').json();
}

// ─── Admin: Formation Sections ──────────────────────────────────

export async function adminGetFormacaoSections() {
  return client.get('/api/admin/formacao/sections').json();
}

export async function adminCreateSection(data: { title: string; sort_order?: number }) {
  return client.post('/api/admin/formacao/sections', { json: data }).json();
}

export async function adminUpdateSection(id: string, data: { title?: string; sort_order?: number; is_active?: boolean }) {
  return client.patch(`/api/admin/formacao/sections/${id}`, { json: data }).json();
}

export async function adminDeleteSection(id: string, force = false) {
  return client.delete(`/api/admin/formacao/sections/${id}${force ? '?force=true' : ''}`).json();
}

export async function adminUpdateSectionCourses(id: string, courses: { course_id: string; sort_order: number }[]) {
  return client.put(`/api/admin/formacao/sections/${id}/courses`, { json: { courses } }).json();
}

export async function adminReorderSections(items: { id: string; sort_order: number }[]) {
  return client.patch('/api/admin/formacao/sections/reorder', { json: { items } }).json();
}

export async function adminUpdateCourseSales(id: string, data: {
  sales_url?: string | null;
  offer_badge_enabled?: boolean;
  offer_badge_text?: string | null;
}) {
  return client.patch(`/api/admin/courses/${id}/sales`, { json: data }).json();
}

/** Alias used in AdminFormacaoPage — returns the same shape as adminGetCourses */
export async function adminListCourses() {
  return client.get('/api/admin/courses').json();
}

export async function adminGetUserProgress(id: string) {
  return client.get(`/api/admin/users/${id}/progress`).json();
}

export async function adminGetUserCreditBalance(id: string): Promise<{
  available: number;
  reserved: number;
  total_consumed: number;
  consumed_this_month: number;
  transaction_count: number;
}> {
  return client.get(`/api/admin/users/${id}/credit-balance`).json();
}

export async function adminGetUserAuditLogs(
  id: string,
  params?: { limit?: number; offset?: number },
) {
  const clean: Record<string, string> = { target_id: id };
  if (params?.limit != null) clean.limit = String(params.limit);
  if (params?.offset != null) clean.offset = String(params.offset);
  const search = new URLSearchParams(clean).toString();
  return client.get(`/api/admin/users/audit?${search}`).json();
}

export async function adminUploadCourseBanner(
  courseId: string,
  file: File,
): Promise<{ banner_url: string }> {
  const { useAuthStore } = await import('../stores/authStore.ts');
  const session = useAuthStore.getState().session;

  const formData = new FormData();
  formData.append('file', file);

  const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

  const res = await fetch(`${API_URL}/api/admin/courses/${courseId}/banner`, {
    method: 'POST',
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Upload falhou: ${res.status}`);
  }

  return res.json() as Promise<{ banner_url: string }>;
}

export async function adminUploadCourseCover(
  courseId: string,
  file: File,
): Promise<{ cover_url: string }> {
  const { useAuthStore } = await import('../stores/authStore.ts');
  const session = useAuthStore.getState().session;

  const formData = new FormData();
  formData.append('file', file);

  const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

  const res = await fetch(`${API_URL}/api/admin/courses/${courseId}/cover`, {
    method: 'POST',
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Upload falhou: ${res.status}`);
  }

  return res.json() as Promise<{ cover_url: string }>;
}

export async function adminCreateEnrollment(data: { user_id: string; course_id: string }) {
  return client.post('/api/admin/users/enrollments', { json: data }).json();
}

export async function adminDeleteEnrollment(id: string) {
  return client.delete(`/api/admin/users/enrollments/${id}`).json();
}

// ─── Turmas (Cohorts) ───────────────────────────────────────────

export interface Turma {
  id: string;
  course_id: string;
  name: string;
  description?: string | null;
  drip_type: 'enrollment_date' | 'fixed_date';
  access_start_date?: string | null;
  status: 'active' | 'archived';
  created_at: string;
  courses?: { id: string; title: string; cover_url?: string } | null;
  enrollment_count?: number;
}

export async function adminGetTurmas(): Promise<{ turmas: Turma[] }> {
  return client.get('/api/admin/turmas').json();
}

export async function adminCreateTurma(data: {
  course_id: string;
  name: string;
  description?: string;
  drip_type?: 'enrollment_date' | 'fixed_date';
  access_start_date?: string | null;
}): Promise<Turma> {
  return client.post('/api/admin/turmas', { json: data }).json();
}

export async function adminUpdateTurma(id: string, data: Partial<{
  name: string;
  description: string | null;
  drip_type: 'enrollment_date' | 'fixed_date';
  access_start_date: string | null;
  status: 'active' | 'archived';
}>): Promise<Turma> {
  return client.put(`/api/admin/turmas/${id}`, { json: data }).json();
}

export async function adminDeleteTurma(id: string) {
  return client.delete(`/api/admin/turmas/${id}`).json();
}

export async function adminGetTurmaEnrollments(turmaId: string): Promise<{
  enrollments: Array<{
    id: string;
    enrolled_at: string;
    user_id: string;
    profiles?: { full_name?: string; email?: string } | null;
  }>;
}> {
  return client.get(`/api/admin/turmas/${turmaId}/enrollments`).json();
}

export async function adminAddTurmaEnrollment(turmaId: string, data: { user_id: string }) {
  return client.post(`/api/admin/turmas/${turmaId}/enrollments`, { json: data }).json();
}

export async function adminRemoveTurmaEnrollment(turmaId: string, enrollmentId: string) {
  return client.delete(`/api/admin/turmas/${turmaId}/enrollments/${enrollmentId}`).json();
}

// ─── Ofertas ────────────────────────────────────────────────────

export interface Oferta {
  id: string;
  name: string;
  type: 'one-time' | 'subscription';
  price_display?: string | null;
  status: 'active' | 'archived';
  created_at: string;
  oferta_turmas?: Array<{
    sort_order: number;
    turmas: Turma | null;
  }>;
}

export async function adminGetOfertas(): Promise<{ ofertas: Oferta[] }> {
  return client.get('/api/admin/ofertas').json();
}

export async function adminCreateOferta(data: {
  name: string;
  type: 'one-time' | 'subscription';
  price_display?: string;
}): Promise<Oferta> {
  return client.post('/api/admin/ofertas', { json: data }).json();
}

export async function adminUpdateOferta(id: string, data: Partial<{
  name: string;
  type: 'one-time' | 'subscription';
  price_display: string | null;
  status: 'active' | 'archived';
}>): Promise<Oferta> {
  return client.put(`/api/admin/ofertas/${id}`, { json: data }).json();
}

export async function adminDeleteOferta(id: string) {
  return client.delete(`/api/admin/ofertas/${id}`).json();
}

export async function adminGetOferta(id: string): Promise<Oferta> {
  return client.get(`/api/admin/ofertas/${id}`).json();
}

export async function adminUpdateOfertaTurmas(id: string, turma_ids: string[]) {
  return client.put(`/api/admin/ofertas/${id}/turmas`, { json: { turma_ids } }).json();
}
