import { useAuthStore } from '../stores/authStore.ts';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

interface RequestOptions {
  json?: unknown;
  headers?: Record<string, string>;
}

interface ResponsePromise {
  json: <T = unknown>() => Promise<T>;
}

function makeRequest(
  method: string,
  path: string,
  options: RequestOptions = {},
): ResponsePromise {
  const execute = async <T>(): Promise<T> => {
    const session = useAuthStore.getState().session;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
    }

    if (res.status === 204) return {} as T;
    return res.json() as Promise<T>;
  };

  return {
    json: execute,
  };
}

export const client = {
  get:    (path: string, opts?: RequestOptions) => makeRequest('GET',    path, opts),
  post:   (path: string, opts?: RequestOptions) => makeRequest('POST',   path, opts),
  put:    (path: string, opts?: RequestOptions) => makeRequest('PUT',    path, opts),
  patch:  (path: string, opts?: RequestOptions) => makeRequest('PATCH',  path, opts),
  delete: (path: string, opts?: RequestOptions) => makeRequest('DELETE', path, opts),
};

/** @deprecated use `client` instead */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = options.headers as Record<string, string> | undefined;
  const body = options.body ? JSON.parse(options.body as string) : undefined;
  const opts = { headers, json: body };
  switch (method) {
    case 'POST':   return client.post(path, opts).json<T>();
    case 'PUT':    return client.put(path, opts).json<T>();
    case 'PATCH':  return client.patch(path, opts).json<T>();
    case 'DELETE': return client.delete(path, opts).json<T>();
    default:       return client.get(path, opts).json<T>();
  }
}
