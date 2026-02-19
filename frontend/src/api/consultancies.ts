import { apiFetch } from './client.ts';

export interface Consultancy {
  id: string;
  user_id: string;
  title: string;
  client_name: string | null;
  status: 'active' | 'archived';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConsultancyPayload {
  title: string;
  client_name?: string;
}

export interface UpdateConsultancyPayload {
  title?: string;
  client_name?: string;
  status?: 'active' | 'archived';
}

export function fetchConsultancies(): Promise<{ data: Consultancy[] }> {
  return apiFetch('/api/consultancies');
}

export function fetchConsultancy(id: string): Promise<{ data: Consultancy }> {
  return apiFetch(`/api/consultancies/${id}`);
}

export function createConsultancy(
  payload: CreateConsultancyPayload,
): Promise<{ data: Consultancy }> {
  return apiFetch('/api/consultancies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateConsultancy(
  id: string,
  payload: UpdateConsultancyPayload,
): Promise<{ data: Consultancy }> {
  return apiFetch(`/api/consultancies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteConsultancy(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/consultancies/${id}`, {
    method: 'DELETE',
  });
}
