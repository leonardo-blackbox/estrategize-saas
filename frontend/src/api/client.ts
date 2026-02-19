import { useAuthStore } from '../stores/authStore.ts';

const API_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3001';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = useAuthStore.getState().session;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}
