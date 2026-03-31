import { useMemo } from 'react';

const BASE_URL = 'https://app.estrategize.co/f/tR9qWs4j';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export function useCtaUrl(): string {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const utmParams = new URLSearchParams();
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) utmParams.set(key, value);
    }
    const qs = utmParams.toString();
    return qs ? `${BASE_URL}?${qs}` : BASE_URL;
  }, []);
}
