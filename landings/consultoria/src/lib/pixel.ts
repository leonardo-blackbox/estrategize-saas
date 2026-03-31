declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

export function trackPageView() {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
}

export function trackInitiateForm() {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'SubmitApplication');
  }
}
