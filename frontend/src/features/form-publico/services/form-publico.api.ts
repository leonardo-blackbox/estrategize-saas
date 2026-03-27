const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function fireFormEvent(
  slug: string,
  event: 'view' | 'start' | 'submit',
  sessionToken: string,
  extra?: Record<string, unknown>,
): void {
  fetch(`${API_BASE}/api/forms/${slug}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      session_token: sessionToken,
      event_id: `${sessionToken}-${event}`,
      page_url: window.location.href,
      ...extra,
    }),
  }).catch(() => { /* ignore */ });
}
