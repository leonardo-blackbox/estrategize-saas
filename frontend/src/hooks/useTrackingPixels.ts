// frontend/src/hooks/useTrackingPixels.ts
import { useEffect, useRef } from 'react';

export interface TrackingConfig {
  metaPixelId?: string;
  metaPixelActive?: boolean;
  ga4MeasurementId?: string;
  ga4Active?: boolean;
  tiktokPixelId?: string;
  tiktokPixelActive?: boolean;
}

interface PixelEvents {
  trackFormView: () => void;
  trackFormStart: () => void;
  trackFormSubmit: () => void;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    ttq?: { load: (id: string) => void; page: () => void; track: (event: string, data?: object) => void };
    dataLayer?: unknown[];
  }
}

function injectMetaPixel(pixelId: string) {
  try {
    if (window.fbq) return;
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
  } catch (err) {
    console.warn('[tracking] Meta Pixel init failed:', err);
  }
}

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
    console.warn('[tracking] GA4 init failed:', err);
  }
}

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
    console.warn('[tracking] TikTok Pixel init failed:', err);
  }
}

export function useTrackingPixels(tracking: TrackingConfig | undefined): PixelEvents {
  const initialized = useRef(false);

  useEffect(() => {
    if (!tracking || initialized.current) return;
    initialized.current = true;

    if (tracking.metaPixelActive && tracking.metaPixelId) {
      injectMetaPixel(tracking.metaPixelId);
    }
    if (tracking.ga4Active && tracking.ga4MeasurementId) {
      injectGA4(tracking.ga4MeasurementId);
    }
    if (tracking.tiktokPixelActive && tracking.tiktokPixelId) {
      injectTikTokPixel(tracking.tiktokPixelId);
    }
  }, [tracking]);

  return {
    trackFormView: () => {
      try { window.fbq?.('track', 'PageView'); } catch { /* ignore */ }
      try { window.gtag?.('event', 'page_view'); } catch { /* ignore */ }
      try { window.ttq?.track('ViewContent'); } catch { /* ignore */ }
    },
    trackFormStart: () => {
      try { window.fbq?.('track', 'Lead', { content_name: 'form_start' }); } catch { /* ignore */ }
      try { window.gtag?.('event', 'generate_lead', { form_event: 'start' }); } catch { /* ignore */ }
      try { window.ttq?.track('ClickButton', { content_name: 'form_start' }); } catch { /* ignore */ }
    },
    trackFormSubmit: () => {
      try { window.fbq?.('track', 'CompleteRegistration', { status: true }); } catch { /* ignore */ }
      try { window.gtag?.('event', 'sign_up', { method: 'form' }); } catch { /* ignore */ }
      try { window.ttq?.track('CompleteRegistration'); } catch { /* ignore */ }
    },
  };
}
