// frontend/src/hooks/useTrackingPixels.ts
import { useEffect, useRef } from 'react';

export interface TrackingConfig {
  metaPixelId?: string;
  metaPixelActive?: boolean;
  /** 'pixel' = browser-only (fbevents.js). 'capi' = server-side only (no browser pixel). */
  metaMode?: 'pixel' | 'capi';
  /** When to fire the Meta Lead event. Defaults to 'submit' (end of form). */
  metaLeadEvent?: 'start' | 'submit';
  ga4MeasurementId?: string;
  ga4Active?: boolean;
  tiktokPixelId?: string;
  tiktokPixelActive?: boolean;
}

interface PixelEvents {
  trackFormView: (eventId?: string) => void;
  trackFormStart: (eventId?: string) => void;
  trackFormSubmit: (eventId?: string) => void;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    gtag?: (...args: unknown[]) => void;
    ttq?: { load: (id: string) => void; page: () => void; track: (event: string, data?: object) => void };
    dataLayer?: unknown[];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEBUG = true; // set to false to mute pixel logs in production

function log(...args: unknown[]) {
  if (DEBUG) console.debug('[pixel]', ...args);
}

/** Fire a Meta noscript image pixel (works even when fbevents.js is blocked). */
function fireMetaImgPixel(pixelId: string, event: string) {
  try {
    const url =
      `https://www.facebook.com/tr?id=${pixelId}&ev=${event}&noscript=1`;
    const img = new Image(1, 1);
    img.src = url;
    log(`img pixel → ${event} (id: ${pixelId})`);
  } catch (err) {
    console.warn('[pixel] img pixel failed:', err);
  }
}

// ─── Meta Pixel ───────────────────────────────────────────────────────────────

function injectMetaPixel(pixelId: string) {
  try {
    log('injecting meta pixel', pixelId);
    if (window.fbq) {
      log('fbq already present, re-initializing pixel id');
      // Re-init in case a different pixel was loaded
      window.fbq('init', pixelId);
      return;
    }
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){
        if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
        t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)
      }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
    `;
    document.head.appendChild(script);
    log('meta pixel script injected');
  } catch (err) {
    console.warn('[pixel] Meta Pixel init failed:', err);
  }
}

function fireMetaEvent(event: string, data?: Record<string, unknown>, eventId?: string) {
  try {
    if (window.fbq) {
      window.fbq('track', event, data ?? {}, eventId ? { eventID: eventId } : undefined);
      log(`fbq → ${event}`, data ?? '', eventId ? `[eventID: ${eventId}]` : '');
    } else {
      log(`fbq not ready for ${event}, fbq =`, window.fbq);
    }
  } catch (err) {
    console.warn('[pixel] Meta event failed:', event, err);
  }
}

// ─── GA4 ──────────────────────────────────────────────────────────────────────

function injectGA4(measurementId: string) {
  try {
    if (window.gtag) return;
    const s1 = document.createElement('script');
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    s1.async = true;
    document.head.appendChild(s1);
    const s2 = document.createElement('script');
    s2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(s2);
  } catch (err) {
    console.warn('[pixel] GA4 init failed:', err);
  }
}

// ─── TikTok Pixel ─────────────────────────────────────────────────────────────

function injectTikTokPixel(pixelId: string) {
  try {
    if (window.ttq) return;
    const script = document.createElement('script');
    script.innerHTML = `
      !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
      ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
      ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
      for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
      ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
      ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
      ttq._o=ttq._o||{};ttq._o[e]=n||{};
      var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
      var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load('${pixelId}');
      }(window,document,'ttq');
    `;
    document.head.appendChild(script);
  } catch (err) {
    console.warn('[pixel] TikTok Pixel init failed:', err);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrackingPixels(tracking: TrackingConfig | undefined): PixelEvents {
  const initialized = useRef(false);
  const pixelIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!tracking) {
      log('no tracking config yet');
      return;
    }
    log('tracking config received:', tracking);

    if (initialized.current) {
      log('already initialized, skipping');
      return;
    }
    initialized.current = true;

    const isCapi = tracking.metaMode === 'capi';

    if (tracking.metaPixelActive && tracking.metaPixelId) {
      pixelIdRef.current = tracking.metaPixelId;
      if (!isCapi) {
        // Pixel Normal: inject browser SDK
        injectMetaPixel(tracking.metaPixelId);
      } else {
        log('CAPI mode: skipping browser pixel injection (server-side only)');
      }
    } else {
      log('meta pixel inactive or no id:', {
        active: tracking.metaPixelActive,
        id: tracking.metaPixelId,
      });
    }

    if (tracking.ga4Active && tracking.ga4MeasurementId) {
      injectGA4(tracking.ga4MeasurementId);
    }

    if (tracking.tiktokPixelActive && tracking.tiktokPixelId) {
      injectTikTokPixel(tracking.tiktokPixelId);
    }
  }, [tracking]);

  const isCapi = tracking?.metaMode === 'capi';

  return {
    trackFormView: (eventId?: string) => {
      if (isCapi) { log('CAPI mode: skipping browser PageView (server handles it)'); }
      else {
        log('trackFormView called, fbq =', !!window.fbq);
        fireMetaEvent('PageView', undefined, eventId);
      }
      try { window.gtag?.('event', 'page_view'); } catch { /* ignore */ }
      try { window.ttq?.track('ViewContent'); } catch { /* ignore */ }
    },
    trackFormStart: (eventId?: string) => {
      const leadEvent = tracking?.metaLeadEvent ?? 'submit';
      if (!isCapi && leadEvent === 'start') {
        fireMetaEvent('Lead', { content_name: 'form_start' }, eventId);
        log('Lead fired at form start (browser pixel)');
      } else {
        log('Lead skipped at form start — mode:', isCapi ? 'capi' : 'pixel', 'leadEvent:', leadEvent);
      }
      try { window.gtag?.('event', 'generate_lead', { form_event: 'start' }); } catch { /* ignore */ }
      try { window.ttq?.track('ClickButton', { content_name: 'form_start' }); } catch { /* ignore */ }
    },
    trackFormSubmit: (eventId?: string) => {
      if (isCapi) {
        log('CAPI mode: skipping browser Lead/CompleteRegistration (server handles it)');
      } else {
        log('trackFormSubmit called, fbq =', !!window.fbq);
        const leadEvent = tracking?.metaLeadEvent ?? 'submit';
        if (leadEvent === 'submit') {
          fireMetaEvent('Lead', { content_name: 'form_submit' }, eventId ? `${eventId}-lead` : undefined);
        }
        fireMetaEvent('CompleteRegistration', { status: true }, eventId ? `${eventId}-completeregistration` : undefined);
      }
      try { window.gtag?.('event', 'sign_up', { method: 'form' }); } catch { /* ignore */ }
      try { window.ttq?.track('CompleteRegistration'); } catch { /* ignore */ }
    },
  };
}
